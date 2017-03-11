'use strict';
const utils = require('./utils');
const globalFilters = require('./filters');
const deepGet = require('lodash/get');
const path = require('path');
let currentAst;
let filters;

module.exports = function(ast, scope, mus) {
  filters = mus.filters;

  let result;

  // process ast
  const extendsEl = ast.extends;
  if (extendsEl) {
    const fileUrl = computedExpression(scope, extendsEl);
    const parentAst = mus.getAstByUrl(fileUrl);
    result = new Render({ ast: parentAst, scope, extend: ast, mus }).compile();
  } else {
    result = new Render({ ast, scope, mus }).compile();
  }

  filters = null;
  return result;
};

class Render {
  constructor({ ast, scope = {}, extend, mus }) {
    this.ast = ast;
    this.scope = scope;
    this.extend = extend;
    this.mus = mus;
    this.cache = new Map();
  }

  compile(ast = this.ast, scope = this.scope) {
    return this.processAst(ast.root, scope);
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
        if (el.method && this.ast.macro && this.ast.macro.has(el.method)) {
          const macroEl = this.ast.macro.get(el.method);
          scope[el.method] = macroEl.makeFunction(
            Object.assign({}, scope), // use new scope
            (scope) => this.processAst(macroEl.children, scope)
          );
        }

        const result = computedExpression(scope, el);
        html += el.safe ? result : utils.escape(result);
      } else if (el.type === 1) {
        // block handling
        if (el.for) {
          html += this.processFor(el, scope);
        } else if (el.if) {
          html += this.processIf(el, scope);
        } else if (el.set) {
          scope[el.key] = computedExpression(scope, el);
        } else if (el.raw) {
          html += this.processAst(el.children);
        } else if (el.block) {
          html += this.processBlock(el, scope);
        } else if (el.include) {
          const fileUrl = computedExpression(scope, el);
          const includeAst = this.mus.getAstByUrl(fileUrl);
          const render = this.inheritRender(includeAst);
          html += render.compile();
        }
      }
    }
    return html;
  }

  inheritRender(ast) {
    return utils.cache(ast.id, () => (
      new Render({
        ast: ast,
        scope: this.scope,
        mus: this.mus,
      })
    ), this.cache);
  }

  processBlock(el, scope) {
    let extendBlock = this.extend
      && this.extend.blocks
      && this.extend.blocks[el.name];

    if (extendBlock) {
      const extendRender = this.inheritRender(this.extend);
      return extendRender.processAst(extendBlock.children);
    } else {
      return this.processAst(el.children, scope);
    }
  }

  processFor(el, scope) {
    let html = '';
    const result = computedExpression(scope, el);
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
    if (computedExpression(scope, el)) {
      html += this.processAst(el.children, scope);
    } else {
      let elseIfAdded = false;

      // check else if
      if (el.elseifBlock) {
        for (let j = 0; j < el.elseifBlock.length; j++) {
          const elseifBlock = el.elseifBlock[j];
          if (computedExpression(scope, elseifBlock)) {
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
}

function processFilter(filterName, str) {
  const filter = filters[filterName] || globalFilters[filterName];

  if (!filter) {
    throw new Error(`unknown filter ${filterName}`);
  }

  return filter(str);
}

function computedExpression(scope, el) {
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
      result = processFilter(filter, result);
    });
  }

  return result;
}
