'use strict';

const utils = require('../utils/utils');
const forTagRE = /^(\w+)(?:\s*,\s*(\w+))?\s*in\s([\s\S]+)$/;
const macroTagRE = /^(\w+)(?:\(([\w,\s]*?)\))?\s*$/;
const filterREStr = '\\|\\s*(\\w+)(\\([^|]*\\))?\\s*';
const filterGroupRE = new RegExp(`(?:\\s*${filterREStr})+$`);
const filterRE = new RegExp(filterREStr, 'g');

// match obj.test | '123' | 123
const objectRE = /^\w+(?:(?:\.|\[)[\w\-'"]+(?:\])?)*$/;
const stringRE = /^(?:'|")([^'"]*?)(?:'|")$/;
const numberRE = /^\d+$/;
const functionRE = /^(\w+)\(/;

module.exports = {
  variable(el, expr) {
    processExpression(expr, el);

    if (functionRE.test(el.expression)) {
      el.method = RegExp.$1;
    }

    return el;
  },

  for (el, expr) {
    if (!forTagRE.test(expr)) {
      return;
    }

    el.value = RegExp.$1;
    el.index = RegExp.$2;
    processExpression(RegExp.$3, el);
    return el;
  },

  if (el, expr) {
    if (!expr) {
      throw new Error('if condition not found');
    }

    return processExpression(expr, el);
  },

  else (el) {
    const ifEl = getIfEl(el);
    ifEl.elseBlock = el;
    return el;
  },

  elseif(el, expr) {
    if (el.parent && el.parent.else) {
      throw new Error('parse error, else behind elseif');
    }

    const ifEl = getIfEl(el);
    ifEl.elseifBlock = ifEl.elseifBlock || [];
    ifEl.elseifBlock.push(el);
    return processExpression(expr, el);
  },

  set(el, expr) {
    if (!expr) {
      return;
    }

    const index = expr.indexOf('=');
    el.key = expr.slice(0, index).trim();
    el.isUnary = true;
    return processExpression(expr.slice(index + 1), el);
  },

  raw: (el) => el,

  macro(el, expr, ast) {
    if (!macroTagRE.test(expr)) {
      return;
    }

    el.isAlone = true;
    ast.macro = ast.macro || new Map();
    ast.macro.set(RegExp.$1, el);

    // assign key to scope
    let setScope = '';
    if (RegExp.$2) {
      setScope = RegExp.$2.split(',').map((item, index) => {
        return `scope['${item.trim()}'] = arguments[${index}];`
      }).join('');
    }

    // macro render function
    el.makeFunction = new Function(
      'scope',
      'process',
      `return function(${el.args || ''}){
        ${setScope}
        return process(scope);
       }`
    );

    return el;
  },

  extends (el, expr, ast) {
    if (!expr) {
      throw new Error('extends url not found');
    }

    el.isUnary = el.isAlone = true;
    processExpression(expr, el);
    ast.extends = el;
    return el;
  },

  block(el, expr, ast) {
    if (!expr) {
      throw new Error('block name not found');
    }

    el.name = expr;
    ast.blocks = ast.blocks || new Map();
    ast.blocks[el.name] = el;
    return el;
  },

  include(el, expr) {
    el.isUnary = true;
    processExpression(expr, el);
    return el;
  }
};

function getIfEl(el) {
  const ifEl = el.parent ? (el.parent.ifBlock || el.parent) : null;
  if (!ifEl) {
    throw new Error('parse error, if block not found')
  }
  el.ifBlock = el.parent = ifEl;
  el.isAlone = true;
  return ifEl;
}

function processExpression(expr, el) {
  if (!(expr = expr.trim())) {
    return;
  }

  const matches = expr.match(filterGroupRE);

  if (matches) {
    expr = expr.substring(0, matches.index);
    const filterString = matches[0];

    // wrap filter function
    while (filterRE.test(filterString)) {
      const name = RegExp.$1;
      const args = RegExp.$2;
      if (name === 'safe') {
        el.safe = true;
      } else {
        let newArgs;
        if (args) {
          newArgs = `(${expr}, ${args.substring(1)}`;
        } else {
          newArgs = `(${expr})`;
        }

        expr = `_$f('${name}')${newArgs}`;
      }
    }
  }

  el.expression = expr;

  // guess the expression's type 
  // it use to decide which way to render expression
  if (stringRE.test(expr)) {
    el.isString = true;
    el.expression = RegExp.$1;
  } else if (numberRE.test(expr)) {
    el.isNumber = true;
  } else if (objectRE.test(expr)) {
    el.isObject = true;
  } else {
    el.render = new Function(
      '_$o',
      '_$f',
      `with(_$o){ return (${expr.replace(/\r?\n/, '\\n')}) }`
    );
  }

  return el;
}
