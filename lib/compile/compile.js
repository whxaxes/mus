'use strict';

const assert = require('assert');
const utils = require('../utils/utils');
const constant = require('./constant');
const RENDER_STORE_SYMBOL = Symbol('Mus#store');
const globalFns = ['range', 'regular'];

class Compiler {
  constructor({ ast, scope = {}, mus, parent }) {
    assert(!!mus, 'mus must exist!!');
    this.ast = ast;
    this.scope = scope;
    this.mus = mus;
    this.parent = parent; // parent compiler
    this.async = mus.async;

    // add global function
    globalFns.forEach(fn => {
      scope[fn] = scope.hasOwnProperty(fn) ? scope[fn] : utils[fn];
    });
  }

  // render store
  // Using for custom tag to store temporary data in a single rendering.
  get store() {
    if (this.parent) {
      return this.parent.store;
    }

    if (!this[RENDER_STORE_SYMBOL]) {
      this[RENDER_STORE_SYMBOL] = {};
    }

    return this[RENDER_STORE_SYMBOL];
  }

  compile(cb) {
    const ast = this.ast;
    const scope = this.scope;
    if (ast.extends) {
      this.computed(ast.extends, scope, fileUrl => {
        const absoluteUrl = this.mus.resolveUrl(fileUrl);
        this.mus.relativeHook(absoluteUrl);

        return new Compiler({
          ast: this.mus.getAstByUrl(absoluteUrl),
          scope: Object.assign({}, scope),
          mus: this.mus,
          parent: this,
        }).compile(cb);
      });
    } else {
      return this.processAst(ast.root, scope, cb);
    }
  }

  include(url, scope, cb) {
    const absoluteUrl = this.mus.resolveUrl(url);
    this.mus.relativeHook(absoluteUrl);
    const includeAst = this.mus.getAstByUrl(absoluteUrl);
    return new Compiler({
      ast: includeAst,
      scope,
      mus: this.mus,
      parent: this,
    }).compile(cb);
  }

  processAst(root, scope, cb) {
    if (!root || !root.length) {
      return cb('');
    }

    let html = '';
    let i = 0;
    const handleEl = () => {
      const el = root[i];
      const done = frag => {
        i++;

        if (frag) {
          html += frag;
        }

        if (i < root.length) {
          handleEl();
        } else {
          cb(html);
        }
      };

      if (el.type === constant.TYPE_TEXT) {
        // text handling
        done(el.text);
      } else if (el.type === constant.TYPE_VAR) {
        // variable handling
        this.processVariable(el, scope, done);
      } else if (el.type === constant.TYPE_TAG) {
        // block handling
        if (el.for) {
          this.processFor(el, scope, done);
        } else if (el.if) {
          this.processIf(el, scope, done);
        } else if (el.set) {
          this.computed(el, scope, result => {
            scope[el.key] = result;
            done();
          });
        } else if (el.block) {
          this.processBlock(el, scope, done);
        } else if (el.include) {
          this.processInclude(el, scope, done);
        } else if (el.import) {
          this.processImport(el, scope, done);
        } else if (el.filter) {
          this.processAst(el.children, scope, result => {
            scope._$r = result;
            this.computed(el, scope, done);
          });
        } else if (el.raw) {
          this.processAst(el.children, undefined, done);
        } else if (el.isCustom) {
          this.processCustom(el, scope, done);
        }
      } else {
        done('');
      }
    };

    handleEl();
  }

  processVariable(el, scope, cb) {
    const done = result => {
      cb(el.safe || !this.mus.autoescape ? result : utils.escape(result));
    };

    if (el.method && this.ast.macro && this.ast.macro.has(el.method)) {
      const macroEl = this.ast.macro.get(el.method);

      // execute method only.
      utils.simpleSet(
        scope,
        el.method,
        macroEl.genRender(
          Object.assign({}, scope), // use new scope
          scope => this.processAst(macroEl.children, scope, done)
        )
      );

      return this.computed(el, scope, () => {});
    }

    this.computed(el, scope, done);
  }

  processImport(el, scope, cb) {
    this.computed(el, scope, fileUrl => {
      const absoluteUrl = this.mus.resolveUrl(fileUrl);
      this.mus.relativeHook(absoluteUrl);
      const ast = this.mus.getAstByUrl(absoluteUrl);

      if (ast.macro.size) {
        // copy macro to current ast
        const prefix = el.item ? `${el.item}.` : '';
        ast.macro.forEach((macroEl, key) => {
          this.ast.macro.set(`${prefix}${key}`, macroEl);
        });
      } else {
        utils.warn('you are importing a non-macro template!', el);
      }

      cb();
    });
  }

  processInclude(el, scope, cb) {
    const attr = el.attrFunc(scope);
    const fileUrl = attr._url;
    if (!fileUrl) {
      utils.throw('include url invalid!', el);
    }
    return this.include(fileUrl, Object.assign({}, this.scope, attr), cb);
  }

  processCustom(el, scope, cb) {
    const attr = el.attrFunc ? el.attrFunc(scope) : {};
    const wrap = fn => (opt, scope) => {
      if (this.async) {
        return new Promise(resolve => fn.call(this, opt, scope, resolve));
      } else {
        let html = '';
        fn.call(this, opt, scope, content => (html = content));
        return html;
      }
    };

    const result = el.render(
      attr,
      Object.assign({}, scope),
      {
        store: this.store,
        fileUrl: el._ast.fileUrl,
        include: wrap(this.include),
        compile: wrap(this.processAst),
      }
    );

    const done = text => cb(text === undefined || text === null ? '' : text);
    if (result && this.async && typeof result.then === 'function') {
      return result.then(done);
    } else {
      done(result);
    }
  }

  processBlock(el, scope, cb) {
    const block =
      this.parent &&
      this.parent.ast.extends &&
      this.parent.ast.blocks &&
      this.parent.ast.blocks.get(el.name);

    if (block) {
      return this.parent.processAst(block.children, scope, cb);
    } else {
      return this.processAst(el.children, scope, cb);
    }
  }

  processFor(el, scope, cb) {
    let html = '';
    let loopScope;
    let index = 0;
    const handleEl = (len, next) => {
      if (!len) return cb('');

      const { value, key } = next();
      loopScope = loopScope || Object.assign({}, scope);
      loopScope[el.value] = value;
      loopScope.loop = {
        index: index + 1,
        index0: index,
        length: len,
      };

      if (el.index) {
        loopScope[el.index] = key;
      }

      index++;
      this.processAst(el.children, loopScope, fragment => {
        html += fragment;

        // end
        if (index === len) {
          cb(html);
        } else {
          handleEl(len, next);
        }
      });
    };

    this.computed(el, scope, result => {
      if (Array.isArray(result)) {
        handleEl(result.length, () => ({
          value: result[index],
          key: index,
        }));
      } else {
        const objKeys = Object.keys(result);
        handleEl(objKeys.length, () => {
          const key = objKeys[index];
          return { value: result[key], key };
        });
      }
    });
  }

  processIf(el, scope, cb) {
    // check if
    this.computed(el, scope, result => {
      if (result) {
        return this.processAst(el.children, scope, cb);
      }

      const checkElse = () => {
        if (el.elseBlock) {
          this.processAst(el.elseBlock.children, scope, cb);
        } else {
          cb();
        }
      };

      const checkElseIf = (i = 0) => {
        const currElseifBlock = el.elseifBlock[i];
        if (!currElseifBlock) {
          return checkElse();
        }

        this.computed(currElseifBlock, scope, result => {
          if (result) {
            return this.processAst(currElseifBlock.children, scope, cb);
          }

          checkElseIf(i + 1);
        });
      };

      if (el.elseifBlock) {
        checkElseIf();
      } else {
        checkElse();
      }
    });
  }

  processFilter(filterName) {
    const filter = this.mus.filters[filterName];

    if (!filter) {
      throw new Error(`unknown filter ${filterName}`);
    }

    return filter;
  }

  computed(obj, scope, cb) {
    let result;
    const onError = e => {
      // only catch the not defined error
      const msg = e.message;
      if (msg.indexOf('is not defined') >= 0 || msg.indexOf('Cannot read property') >= 0) {
        cb('');
      } else {
        utils.throw(e.message, obj);
      }
    };

    try {
      result = obj.render(scope, this.processFilter.bind(this));
    } catch (e) {
      return onError(e);
    }

    if (result && this.async && typeof result.then === 'function') {
      result.then(cb, onError);
    } else {
      cb(result);
    }
  }
}

module.exports = function(ast, scope, mus, cb) {
  return new Compiler({ ast, scope, mus }).compile(cb || (() => {}));
};
