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
      utils.throw('parse error, for expression invalid', el);
    }

    el.value = RegExp.$1;
    el.index = RegExp.$2;
    processExpression(RegExp.$3, el);
    return el;
  },

  if (el, expr) {
    if (!expr) {
      utils.throw('parse error, if condition invalid', el);
    }

    return processExpression(expr, el);
  },

  else (el) {
    const ifEl = getIfEl(el);
    ifEl.elseBlock = el;
    return el;
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
    return processExpression(expr, el);
  },

  set(el, expr) {
    if (!expr) {
      utils.throw('parse error, set expression invalid', el);
    }

    const index = expr.indexOf('=');
    el.key = expr.slice(0, index).trim();
    el.isUnary = true;
    return processExpression(expr.slice(index + 1), el);
  },

  raw(el) {
    el.isAlone = true;
    return el;
  },

  macro(el, expr, ast) {
    if (!macroTagRE.test(expr)) {
      return utils.throw('parse error, macro name invalid', el);
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
      utils.throw('parse error, extends url invalid', el);
    }

    el.isUnary = el.isAlone = true;
    processExpression(expr, el);
    ast.extends = el;
    return el;
  },

  block(el, expr, ast) {
    if (!expr) {
      utils.throw('parse error, block name invalid', el);
    }

    el.name = expr;
    ast.blocks = ast.blocks || new Map();
    ast.blocks.set(el.name, el);
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
    utils.throw('parse error, if block not found', el);
  }
  el.ifBlock = el.parent = ifEl;
  el.isAlone = true;
  return ifEl;
}

function processExpression(expr, el) {
  if (!(expr = expr.trim())) {
    return utils.throw('parse error, expression invalid', el);
  }

  const matches = expr.match(filterGroupRE);
  let flStr = ''; // _$f('json')(_$f('nl2br')(
  let frStr = ''; // ))

  if (matches) {
    expr = expr.substring(0, matches.index);
    const filterString = matches[0];

    // collect filter string
    while (filterRE.test(filterString)) {
      const name = RegExp.$1;
      const args = RegExp.$2;
      if (name === 'safe') {
        el.safe = true;
      } else {
        flStr = `_$f('${name}')(${flStr}`;
        if (args) {
          frStr = `${frStr}, ${args.substring(1)}`;
        } else {
          frStr = `${frStr})`;
        }
      }
    }
  }

  el.expression = expr;
  let computedString;
  let useWith = false;

  // guess the expression's type 
  // it use to decide which way to render expression
  if (stringRE.test(expr) || numberRE.test(expr)) {
    if (flStr) {
      computedString = expr;
    } else {
      el.expression = RegExp.$1 || el.expression;
    }
  } else if (objectRE.test(expr)) {
    // simple render, like {{ test }}
    computedString = `_$o.${expr}`;
  } else {
    // computed render, like {{ test > 1 ? 1 : 2 }}
    computedString = expr;
    useWith = true;
  }

  // create render function
  if (computedString) {
    computedString = utils.nlEscape(`${flStr}${computedString}${frStr}`);
    let funcStr = `
      var result = ${computedString};
      return (result === undefined || result === null) ? '' : result;
    `;

    if (useWith) {
      funcStr = `with(_$o){ ${funcStr} }`;
    }

    try {
      el.render = new Function('_$o', '_$f', funcStr);
    } catch (e) {
      utils.throw(e.message, el);
    }
  }

  return el;
}
