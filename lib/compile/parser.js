'use strict';
const utils = require('../utils/utils');
const filterREStr = '\\|\\s*(\\w+)(\\([^|]*\\))?\\s*';
const filterGroupRE = new RegExp(`(?:\\s*${filterREStr})+$`);
const filterRE = new RegExp(filterREStr, 'g');

// match obj.test || obj.test.test
const objectRE = /^\w+(?:\.[\w\-'"]+)*$/;
const otherRE = /^(true|false|null|NaN|undefined|\d+)$/;
const operatorList = '()%+-<>!?*/:=&|[], '.split('');
const optMapping = {
  not: '!',
  or: '||',
  and: '&&',
};

// parse attribute on tag
exports.parseAttr = function(expr, attrName = 'default') {
  const result = this.parseString(expr);
  const list = result.list;
  let key = '';
  let str = '';
  let i = 0;
  let functionStr = '';

  while (i < list.length) {
    const astNode = list[i];

    // split key and value by equal sign
    if (astNode.expr.trim() === '=') {
      str = str.trim();
      const lastSpaceIndex = str.lastIndexOf(' ');
      if (lastSpaceIndex < 0) {
        key = str;
      } else {
        setValue(str.substring(0, lastSpaceIndex));
        key = str.substring(lastSpaceIndex);
      }
      str = '';
    } else {
      str += result.needWith
        ? astNode.expr
        : (astNode.newExpr || astNode.expr);
    }

    if (++i === list.length) {
      setValue(str);
    }
  }

  function setValue(s) {
    let property;
    if (key) {
      property = key.trim();
      if (!result.needWith) {
        property = property.replace('_$o.', '');
      }
    } else {
      property = attrName;
    }
    functionStr += `_$s['${property}'] = ${s.trim()};`;
  }

  let func;
  functionStr = `_$s = _$s || {}; ${functionStr} return _$s`;

  try {
    func = new Function(
      '_$o', '_$s',
      result.needWith ? `with(_$o) { ${functionStr} }` : functionStr
    );
  } catch (e) {
    return { error: e };
  }

  return func;
};

// parse filter, remove filter string from expression
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
  let newExpr = '';
  const fil = this.parseFilter(expr);
  const result = this.parseString(fil.expr);
  if (result.needWith) {
    newExpr = fil.expr;
  } else {
    // recompose all expr element
    result.list.forEach(item => {
      newExpr += item.newExpr || item.expr;
    });
  }

  // create render function
  let funcStr = `
    var result = ${utils.nlEscape(`${fil.flStr}${newExpr}${fil.frStr}`)};
    return (result === undefined || result === null) ? '' : result;
  `;

  if (result.needWith) {
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

// parse expression
// abc > 3 ? bb : cc => _$o.abc > 3 ? _$o.bb : _$o.cc
exports.parseString = function(expr) {
  let stringSymbol;
  let i = 0;
  let savor = '';
  let needWith = false;
  const list = [];

  while (i <= expr.length) {
    let char = expr.charAt(i);
    i++;

    if (char === '\'' || char === '"') {
      if (stringSymbol === char) {
        stringSymbol = null;
        list.push({ expr: (savor + char).trim() });
        savor = '';
        continue;
      } else if (!stringSymbol) {
        stringSymbol = char;
      }
    } else if (!stringSymbol && operatorList.indexOf(char) >= 0) {
      if (savor) {
        const opt = optMapping[savor];
        if (opt) {
          char = opt + char;
        } else {
          list.push({ expr: savor, newExpr: formatNewExpr(savor) });
        }
      }

      const last = list[list.length - 1];
      if (last && last.opt) {
        last.expr += char;
      } else {
        list.push({ expr: char, opt: true });
      }
      savor = '';
      continue;
    }

    savor += char;

    if (savor && i === expr.length) {
      list.push({
        expr: savor,
        newExpr: formatNewExpr(savor),
      });
    }
  }

  // check expression type
  function formatNewExpr(str) {
    let newExpr;
    if (!str) {
      return;
    }

    // base type, null|undefined etc.
    if (otherRE.test(str)) {
      newExpr = str;
    } else if (objectRE.test(str)) {
      // add scope object behind property
      newExpr = `_$o.${str}`;
    } else {
      // complex expression, plain object
      needWith = true;
    }
    return newExpr;
  }

  return {
    list,
    needWith,
  };
};
