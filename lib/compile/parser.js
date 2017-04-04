'use strict';
const utils = require('../utils/utils');
const filterREStr = '\\|\\s*(\\w+)(\\([^|]*\\))?\\s*';
const filterGroupRE = new RegExp(`(?:\\s*${filterREStr})+$`);
const filterRE = new RegExp(filterREStr, 'g');

// match obj.test | '123' | 123
const objectRE = /^\w+(?:(?:\.|\[)[\w\-'"]+(?:])?)*$/;
const stringRE = /^(?:'|")[^'"]*?(?:'|")$/;
const otherRE = /^(true|false|null|NaN|undefined|\d+)$/;

exports.parseArgs = function(expr, defaultName = 'default') {
  const exprFormat = this.exprFormat;
  let stringSymbol;
  let i = 0;
  let key = '';
  let savor = '';
  let functionStr = '';
  let needWith;

  while (i <= expr.length) {
    let char = expr.charAt(i);
    if (char === '\'' || char === '"') {
      if (stringSymbol) {
        if (stringSymbol === char) {
          stringSymbol = null;
        }
      } else {
        stringSymbol = char;
      }
    } else if (char === '=' && !stringSymbol) {
      let ci = savor.length;
      let willGet = false;
      let lastSpaceIndex = 0;
      while (ci--) {
        if (savor.charAt(ci) !== ' ') {
          willGet = true;
        } else if (willGet) {
          lastSpaceIndex = ci;
          break;
        }
      }

      advance(savor.substring(0, lastSpaceIndex));
      key = savor.substring(lastSpaceIndex);
      savor = char = '';
    } else if (i === expr.length) {
      advance(savor);
    }

    savor += char;
    i++;
  }

  function advance(value) {
    value = value.trim();
    if (!value) return;

    const typeResult = exprFormat(value, true);
    if (typeResult.needWith) {
      needWith = true;
    }

    const property = key ? key.trim() : defaultName;
    functionStr += `_$s['${property}'] = ${typeResult.newExpr};`;
  }

  functionStr = `_$s = _$s || {}; ${functionStr} return _$s`;
  let func;

  try {
    func = new Function(
      '_$o', '_$s',
      needWith ? `with(_$o) { ${functionStr} }` : functionStr
    );
  } catch (e) {
    return { error: e };
  }

  return func;
};

exports.parseFilter = function(expr) {
  const matches = expr.match(filterGroupRE);
  let safe = false;
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
        safe = true;
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

  return {
    flStr,
    frStr,
    safe,
    expr,
  };
};

exports.parseExpr = function(expr) {
  if (!(expr = expr.trim())) {
    return { error: new Error('parse error, expression invalid') };
  }

  let renderFunc;
  const fil = this.parseFilter(expr);
  const tp = this.exprFormat(fil.expr);

  // create render function
  let funcStr = `
    var result = ${utils.nlEscape(`${fil.flStr}${tp.newExpr}${fil.frStr}`)};
    return (result === undefined || result === null) ? '' : result;
  `;

  if (tp.needWith) {
    funcStr = `with(_$o){ ${funcStr} }`;
  }

  try {
    renderFunc = new Function('_$o', '_$f', funcStr);
  } catch (e) {
    return { error: e };
  }

  return {
    safe: fil.safe,
    render: renderFunc,
    expression: fil.expr,
  };
};

// guess the expression's type
// it use to decide which way to render expression
exports.exprFormat = function(expr) {
  let needWith;
  let newExpr;

  if (stringRE.test(expr) || otherRE.test(expr)) {
    newExpr = expr;
  } else if (objectRE.test(expr)) {
    // simple render, like {{ test }}
    newExpr = `_$o.${expr}`;
  } else {
    // computed render, like {{ test > 1 ? 1 : 2 }}
    newExpr = expr;
    needWith = true;
  }

  return {
    newExpr,
    needWith,
  };
};
