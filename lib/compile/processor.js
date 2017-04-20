'use strict';

const utils = require('../utils/utils');
const parser = require('./parser');
const forTagRE = /^(\w+)(?:\s*,\s*(\w+))?\s*in\s([\s\S]+)$/;
const macroTagRE = /^(\w+)(?:\(([\w,\s]*?)\))?\s*$/;
const functionRE = /^(\w+)\(/;
const conditionRE = /([\s\S]+(?= if )) if ([\s\S]+(?= else )|[\s\S]+)(?: else ([\s\S]+))?/;

module.exports = {
  variable(el, expr) {
    if (expr.indexOf(' if ') >= 0) {
      expr = expr.replace(
        conditionRE,
        (all, res, cond, res2) => `${cond}?${res}:${res2 || '""'}`
      );
    }

    processExpression(expr, el);

    if (functionRE.test(el.expression)) {
      el.method = RegExp.$1;
    }
  },

  for(el, expr) {
    if (!forTagRE.test(expr)) {
      utils.throw('parse error, for expression invalid', el);
    }

    el.value = RegExp.$1;
    el.index = RegExp.$2;
    processExpression(RegExp.$3, el);
  },

  if(el, expr) {
    if (!expr) {
      utils.throw('parse error, if condition invalid', el);
    }

    processExpression(expr, el);
  },

  else(el) {
    const ifEl = getIfEl(el);
    ifEl.elseBlock = el;
  },

  elseif(el, expr) {
    if (!expr) {
      utils.throw('parse error, elseif condition invalid', el);
    }

    if (el.parent && el.parent.else) {
      utils.throw('parse error, else behind elseif', el);
    }

    const ifEl = getIfEl(el);
    ifEl.elseifBlock = ifEl.elseifBlock || [];
    ifEl.elseifBlock.push(el);
    processExpression(expr, el);
  },

  set(el, expr) {
    if (!expr) {
      utils.throw('parse error, set expression invalid', el);
    }

    const index = expr.indexOf('=');
    el.key = expr.slice(0, index).trim();
    el.isUnary = true;
    processExpression(expr.slice(index + 1), el);
  },

  raw(el) {
    el.isAlone = true;
  },

  macro(el, expr) {
    if (!macroTagRE.test(expr)) {
      return utils.throw('parse error, macro name invalid', el);
    }

    el.isAlone = true;
    el._ast.macro = el._ast.macro || new Map();
    el._ast.macro.set(RegExp.$1, el);

    // assign key to scope
    let setScope = '';
    if (RegExp.$2) {
      setScope = RegExp.$2.split(',')
        .map((item, index) => (
          `scope['${item.trim()}'] = arguments[${index}];`
        ))
        .join('');
    }

    // use to generate a render function
    el.genRender = new Function(
      'scope',
      'process',
      `return function(${el.args || ''}){
        ${setScope}
        return process(scope);
       }`
    );
  },

  extends(el, expr) {
    if (!expr) {
      utils.throw('parse error, extends url invalid', el);
    }

    el.isUnary = el.isAlone = true;
    processExpression(expr, el);
    el._ast.extends = el;
  },

  block(el, expr) {
    if (!expr) {
      utils.throw('parse error, block name invalid', el);
    }

    el.name = expr;
    el._ast.blocks = el._ast.blocks || new Map();
    el._ast.blocks.set(el.name, el);
  },

  include(el, expr) {
    if (!expr) {
      utils.throw('parse error, include url invalid', el);
    }

    el.isUnary = true;
    el.attrFunc = parser.parseAttr(expr, '_url');
    if (el.attrFunc.error) {
      utils.throw(el.attrFunc.error.message, el);
    }
  },

  custom(el, expr, extra) {
    el.isCustom = true;
    el.render = extra.render;
    el.isUnary = extra.unary;
    if (expr && !extra.noAttr) {
      el.attrFunc = parser.parseAttr(expr, extra.attrName);
      if (el.attrFunc.error) {
        utils.throw(el.attrFunc.error.message, el);
      }
    }
  },
};

function getIfEl(el) {
  const ifEl = el.parent ? (el.parent.ifBlock || el.parent) : null;
  if (!ifEl) {
    utils.throw('parse error, if block not found', el);
  }
  el.ifBlock = el.parent = ifEl;
  el.isAlone = true;
  return ifEl;
}

function processExpression(expr, el) {
  const result = parser.parseExpr(expr);
  if (result.error) {
    utils.throw(result.error.message, el);
  } else {
    Object.assign(el, result);
  }
}
