'use strict';
const entityMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '`': '&#x60;',
  '=': '&#x3D;',
};
const regexEscapeRE = /[-.*+?^${}()|[\]\/\\]/g;
const nlRE = /\r?\n/g;
const entityRE = new RegExp(`[${Object.keys(entityMap).join('')}]`, 'g');
const cache = new Map();

module.exports = {
  forEach(obj, cb) {
    const type = Object.prototype.toString.apply(obj);
    if (type === '[object Array]') {
      const len = obj.length;
      let i = 0;
      while (i < len) {
        cb(obj[i], i, i, len);
        i++;
      }
    } else if (type === '[object Object]') {
      const len = Object.keys(obj).length;
      let i = 0;
      for (const key in obj) {
        // istanbul ignore else
        if (obj.hasOwnProperty(key)) {
          cb(obj[key], key, i, len);
        }
        i++;
      }
    } else {
      // do nothing
    }
  },

  nl2br(str) {
    return (str && str.replace)
      ? str.replace(nlRE, '<br/>')
      : str;
  },

  escape(str) {
    return String(str).replace(entityRE, s => entityMap[s]);
  },

  nlEscape(str) {
    return str.replace(nlRE, '\\n');
  },

  calculateLines(string, index) {
    string = ''.substring.call(string, 0, index + 1);
    const matches = string.match(nlRE);
    const lastNl = matches && matches[matches.length - 1];
    const lastNlIndex = matches
      ? string.lastIndexOf(lastNl) + lastNl.length
      : 0;
    return {
      line: (matches ? matches.length : 0) + 1,
      index: string.length - lastNlIndex,
    };
  },

  genError(errMsg, el) {
    const ast = el._ast;
    const index = el._index;
    const distance = 3;
    let wholeLen = el._len;
    const lineObj = this.calculateLines(ast.template, index);
    let startLine = lineObj.line - distance;
    startLine = startLine < 0 ? 0 : startLine;
    const stringList = [];
    ast.template
      .split(nlRE)
      .slice(startLine, lineObj.line + distance)
      .forEach((item, index) => {
        index += startLine;
        const leftString = `${index + 1}    `;
        stringList.push(`${leftString}${item}`);

        let strLen;
        let placeLen = leftString.length;
        if (index >= lineObj.line - 1 && wholeLen > 0) {
          if (index === lineObj.line - 1) {
            strLen = item.length - lineObj.index + 1;
            if (strLen > wholeLen) {
              strLen = wholeLen;
            }

            placeLen += lineObj.index - 1;
          } else {
            strLen = wholeLen;
            if (wholeLen > item.length) {
              strLen = item.length;
            }
          }

          stringList.push(new Array(placeLen + 1).join(' ') + new Array(strLen + 1).join('^'));
          wholeLen -= (strLen + 1);
        }
      });

    const error = new Error(errMsg.replace(/_\$o\./, ''));
    const fileUrl = `${ast.fileUrl ? ast.fileUrl : 'Template String'}:${lineObj.line}:${lineObj.index}`;
    const sep = '\n     ';
    error.stack = [
      '',
      fileUrl,
      sep + stringList.join(sep),
      '',
      error.stack,
    ].join('\n');
    return error;
  },

  throw(errMsg, el) {
    throw el._ast ? this.genError(errMsg, el) : new Error(errMsg);
  },

  cache(key, value, c = cache) {
    if (c.has(key)) {
      return c.get(key);
    }

    const isFunction = typeof value === 'function';
    const result = isFunction ? value() : value;
    // istanbul ignore else
    if (result !== null && result !== undefined) {
      c.set(key, result);
    }
    return result;
  },

  reStringFormat(str) {
    return str.replace(regexEscapeRE, '\\$&');
  },
};
