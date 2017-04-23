'use strict';

const utils = require('../utils/utils');
const parser = require('./parser');
const forTagRE = /^(\w+)(?:\s*,\s*(\w+))?\s+in\s([\s\S]+)$/;
const functionRE = /^\s*([\w.]+)\(/;
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

    if (functionRE.test(expr)) {
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

  import(el, expr) {
    if (!expr) {
      return utils.throw('parse error, import url not found', el);
    }

    const expArr = expr.split(' as ');
    processExpression(expArr[0], el);
    el.item = expArr[1] && expArr[1].trim();
    el.isUnary = true;
  },

  macro(el, expr) {
    if (!expr) {
      return utils.throw('parse error, macro name was needed', el);
    }

    el.isAlone = true;
    const result = parser.parseMacroExpr(expr);
    el._ast.genMacro().set(result.methodName, el);
    el.genRender = result.genRender;
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
    try {
      el.attrFunc = parser.parseAttr(expr, '_url');
    } catch (e) {
      utils.throw(e.message, el);
    }
  },

  custom(el, expr, extra) {
    el.isCustom = true;
    el.render = extra.render;
    el.isUnary = extra.unary;
    if (expr && !extra.noAttr) {
      try {
        el.attrFunc = parser.parseAttr(expr, extra.attrName);
      } catch (e) {
        utils.throw(e.message, el);
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
  try {
    Object.assign(el, parser.parseCommonExpr(expr));
  } catch (e) {
    utils.throw(e.message, el);
  }
}
