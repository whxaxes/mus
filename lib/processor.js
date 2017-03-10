'use strict';

const forTagRE = /^(\w+)(?:\s*,\s*(\w+))?\s*in\s([\s\S]+)$/;
const macroTagRE = /^(\w+)(?:\(([\w,\s]*?)\))?\s*$/;
const filterRE = /(?:\|\s*\w+\s*)+$/;
const filterSplitRE = /\s*\|\s*/;

// match obj.test | '123' | 123
const objectRE = /^\w+(?:(?:\.|\[)[\w\-'"]+(?:\])?)*$/;
const stringRE = /^(?:'|")[^'"]*?(?:'|")$/;
const numberRE = /^\d+$/;
const functionRE = /^(\w+)\(/;

module.exports = {
  variable(el, expr) {
    el = processExpression(expr, { type: 3 });

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

    el.collected = true;
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
  }
};

function getIfEl(el) {
  const ifEl = el.parent ? (el.parent.ifBlock || el.parent) : null;
  if (!ifEl) {
    throw new Error('parse error, if block not found')
  }
  el.ifBlock = el.parent = ifEl;
  el.collected = true;
  return ifEl;
}

function processExpression(expr, el) {
  if (!expr) {
    return;
  }

  const matches = expr.match(filterRE);
  let result = expr;

  if (matches) {
    result = result.slice(0, matches.index);
    el.filters = matches[0].trim()
      .split(filterSplitRE)
      .filter(filter => (filter === 'safe')
        ? ((el.safe = true) && false)
        : !!filter);
  }

  el.expression = result.trim();

  // guess the expression's type 
  // it use to decide which way to render expression
  if (stringRE.test(el.expression)) {
    el.isString = true;
  } else if (numberRE.test(el.expression)) {
    el.isNumber = true;
  } else if (objectRE.test(el.expression)) {
    el.isObject = true;
  } else {
    el.renderExpression = new Function(
      '_$o',
      `with(_$o){ return (${el.expression}) }`
    );
  }

  return el;
}
