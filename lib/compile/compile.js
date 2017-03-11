'use strict';
const utils = require('../utils/utils');
const globalFilters = require('../utils/filters');
const deepGet = require('lodash/get');
let temporaryCache = new Map();

module.exports = function(ast, scope, mus) {
  // process ast
  const html = new Compiler({ ast, scope, mus }).compile();

  // clear cache
  temporaryCache.clear();

  return html;
};

class Compiler {
  constructor({ ast, scope = {}, extend, mus }) {
    this.ast = ast;
    this.scope = scope;
    this.extend = extend;
    this.mus = mus;

    // cache current render object
    utils.cache(ast.id, this, temporaryCache);
  }

  compile(ast = this.ast, scope = this.scope) {
    if (ast.extends) {
      const fileUrl = this.computed(scope, ast.extends);
      const parentAst = this.mus.getAstByUrl(fileUrl);
      return new Compiler({
        ast: parentAst,
        scope,
        extend: ast,
        mus: this.mus
      }).compile();
    } else {
      return this.processAst(ast.root, scope);
    }
  }

  processAst(root, scope) {
    if (!root || !root.length) {
      return '';
    }

    let html = '';
    for (let i = 0; i < root.length; i++) {
      const el = root[i];

      // istanbul ignore else
      if (el.type === 2) {
        // text handling
        html += el.text;
      } else if (el.type === 3) {
        // variable handling
        html += this.processVariable(el, scope);
      } else if (el.type === 1) {
        // block handling
        if (el.for) {
          html += this.processFor(el, scope);
        } else if (el.if) {
          html += this.processIf(el, scope);
        } else if (el.set) {
          scope[el.key] = this.computed(scope, el);
        } else if (el.raw) {
          html += this.processAst(el.children);
        } else if (el.block) {
          html += this.processBlock(el, scope);
        } else if (el.include) {
          html += this.processInclude(el, scope);
        }
      }
    }
    return html;
  }

  genCompiler(ast) {
    return utils.cache(ast.id, () => (
      new Compiler({
        ast: ast,
        scope: this.scope,
        mus: this.mus,
      })
    ), temporaryCache);
  }

  processVariable(el, scope) {
    if (el.method && this.ast.macro && this.ast.macro.has(el.method)) {
      const macroEl = this.ast.macro.get(el.method);
      scope[el.method] = macroEl.makeFunction(
        Object.assign({}, scope), // use new scope
        (scope) => this.processAst(macroEl.children, scope)
      );
    }

    const result = this.computed(scope, el);
    return el.safe ? result : utils.escape(result);
  }

  processInclude(el, scope) {
    const fileUrl = this.computed(scope, el);
    const includeAst = this.mus.getAstByUrl(fileUrl);
    const render = this.genCompiler(includeAst);
    return render.compile();
  }

  processBlock(el, scope) {
    let extendBlock = this.extend
      && this.extend.blocks
      && this.extend.blocks[el.name];

    if (extendBlock) {
      const extendCompiler = this.genCompiler(this.extend);
      return extendCompiler.processAst(extendBlock.children);
    } else {
      return this.processAst(el.children, scope);
    }
  }

  processFor(el, scope) {
    let html = '';
    const result = this.computed(scope, el);
    utils.forEach(result, (value, key, index, len) => {
      const o = {
        [el.value]: value,
        loop: {
          index: index + 1,
          index0: index,
          length: len,
        }
      };

      if (el.index) {
        o[el.index] = key;
      }

      html += this.processAst(el.children, Object.assign({}, scope, o));
    });
    return html;
  }

  processIf(el, scope) {
    let html = '';
    // check if
    if (this.computed(scope, el)) {
      html += this.processAst(el.children, scope);
    } else {
      let elseIfAdded = false;

      // check else if
      if (el.elseifBlock) {
        for (let j = 0; j < el.elseifBlock.length; j++) {
          const elseifBlock = el.elseifBlock[j];
          if (this.computed(scope, elseifBlock)) {
            elseIfAdded = true;
            html += this.processAst(elseifBlock.children, scope);
            break;
          }
        }
      }

      // check else
      if (!elseIfAdded && el.elseBlock) {
        html += this.processAst(el.elseBlock.children, scope);
      }
    }
    return html;
  }

  processFilter(filterName, str) {
    const filter = this.mus.filters[filterName] || globalFilters[filterName];

    if (!filter) {
      throw new Error(`unknown filter ${filterName}`);
    }

    return filter(str);
  }

  computed(scope, el) {
    let result;
    const expression = el.expression;
    // performance: deepGet > new Function > with + new Function
    if (el.isString || el.isNumber) {
      result = el.expression;
    } else if (el.isObject) {
      result = deepGet(scope, expression, '');
    } else {
      try {
        result = el.renderExpression(scope);
        result = (result === undefined || result === null) ? '' : result;
      } catch (e) {
        // istanbul ignore else
        // only catch the not defined error
        if (e.message.indexOf('is not defined') >= 0) {
          result = '';
        } else {
          throw e;
        }
      }
    }

    if (el.filters) {
      utils.forEach(el.filters, filter => {
        result = this.processFilter(filter, result);
      });
    }

    return result;
  }
}