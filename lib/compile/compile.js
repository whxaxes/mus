'use strict';

const utils = require('../utils/utils');
const constant = require('./constant');
const RENDER_STORE_SYMBOL = Symbol('Mus#store');
const globalFns = [ 'range', 'regular' ];

class Compiler {
  constructor({ ast, scope = {}, mus, parent }) {
    this.ast = ast;
    this.scope = scope;
    this.mus = mus;
    this.parent = parent; // parent compiler

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

  compile(ast = this.ast, scope = this.scope) {
    if (ast.extends) {
      const fileUrl = this.computed(ast.extends, scope);
      const absoluteUrl = this.mus.resolveUrl(fileUrl);
      this.mus.relativeHook(absoluteUrl);

      return new Compiler({
        ast: this.mus.getAstByUrl(absoluteUrl),
        scope: Object.assign({}, scope),
        mus: this.mus,
        parent: this,
      }).compile();
    } else {
      return this.processAst(ast.root, scope);
    }
  }

  include(url, scope) {
    const absoluteUrl = this.mus.resolveUrl(url);
    this.mus.relativeHook(absoluteUrl);
    const includeAst = this.mus.getAstByUrl(absoluteUrl);
    return new Compiler({
      ast: includeAst,
      scope,
      mus: this.mus,
      parent: this,
    }).compile();
  }

  processAst(root, scope) {
    if (!root || !root.length) {
      return '';
    }

    let html = '';
    let i = 0;
    while (i < root.length) {
      const el = root[i];
      if (el.type === constant.TYPE_TEXT) {
        // text handling
        html += el.text;
      } else if (el.type === constant.TYPE_VAR) {
        // variable handling
        html += this.processVariable(el, scope);
      } else if (el.type === constant.TYPE_TAG) {
        // block handling
        if (el.for) {
          html += this.processFor(el, scope);
        } else if (el.if) {
          html += this.processIf(el, scope);
        } else if (el.set) {
          scope[el.key] = this.computed(el, scope);
        } else if (el.block) {
          html += this.processBlock(el, scope);
        } else if (el.include) {
          html += this.processInclude(el, scope);
        } else if (el.import) {
          this.processImport(el, scope);
        } else if (el.filter) {
          scope._$r = this.processAst(el.children, scope);
          html += this.computed(el, scope);
        } else if (el.raw) {
          html += this.processAst(el.children);
        } else if (el.isCustom) {
          html += this.processCustom(el, scope);
        }
      }

      i++;
    }
    return html;
  }

  processVariable(el, scope) {
    if (el.method && this.ast.macro && this.ast.macro.has(el.method)) {
      const macroEl = this.ast.macro.get(el.method);
      utils.simpleSet(scope, el.method, macroEl.genRender(
        Object.assign({}, scope), // use new scope
        scope => (this.processAst(macroEl.children, scope))
      ));
    }

    const result = this.computed(el, scope);
    return (el.safe || !this.mus.autoescape) ? result : utils.escape(result);
  }

  processImport(el, scope) {
    const fileUrl = this.computed(el, scope);
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
  }

  processInclude(el, scope) {
    const attr = el.attrFunc(scope);
    const fileUrl = attr._url;
    if (!fileUrl) {
      utils.throw('include url invalid!', el);
    }
    return this.include(fileUrl, Object.assign({}, this.scope, attr));
  }

  processCustom(el, scope) {
    const attr = el.attrFunc ? el.attrFunc(scope) : {};
    const result = el.render(
      attr,
      Object.assign({}, scope),
      {
        store: this.store,
        fileUrl: el._ast.fileUrl,
        include: this.include.bind(this),
        compile: this.processAst.bind(this),
      }
    );

    return (typeof result === 'string') ? result : '';
  }

  processBlock(el, scope) {
    const block = this.parent
        && this.parent.ast.extends
        && this.parent.ast.blocks
        && this.parent.ast.blocks.get(el.name);

    if (block) {
      return this.parent.processAst(block.children, scope);
    } else {
      return this.processAst(el.children, scope);
    }
  }

  processFor(el, scope) {
    let html = '';
    let loopScope;
    const result = this.computed(el, scope);
    utils.forEach(result, (value, key, index, len) => {
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

      html += this.processAst(el.children, loopScope);
    });
    return html;
  }

  processIf(el, scope) {
    // check if
    if (this.computed(el, scope)) {
      return this.processAst(el.children, scope);
    } else {
      // check else if
      if (el.elseifBlock) {
        let j = 0;
        while (j < el.elseifBlock.length) {
          const elseifBlock = el.elseifBlock[j];
          if (this.computed(elseifBlock, scope)) {
            return this.processAst(elseifBlock.children, scope);
          }

          j++;
        }
      }

      // check else
      if (el.elseBlock) {
        return this.processAst(el.elseBlock.children, scope);
      }
    }

    return '';
  }

  processFilter(filterName) {
    const filter = this.mus.filters[filterName];

    if (!filter) {
      throw new Error(`unknown filter ${filterName}`);
    }

    return filter;
  }

  computed(obj, scope, el) {
    let result;

    try {
      result = obj.render(scope, this.processFilter.bind(this));
    } catch (e) {
      // only catch the not defined error
      const msg = e.message;
      if (msg.indexOf('is not defined') >= 0 || msg.indexOf('Cannot read property') >= 0) {
        result = '';
      } else {
        utils.throw(e.message, el || obj);
      }
    }

    return result;
  }
}

module.exports = function(ast, scope, mus) {
  return new Compiler({ ast, scope, mus }).compile();
};
