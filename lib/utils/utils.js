'use strict';
const underline = require('node-underline');
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
const scopeRE = /_\$o\./g;
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

  genError(errMsg, el) {
    const ast = el._ast;
    const index = el._index;
    const ul = underline(ast.template, {
      start: index,
      end: index + el._len,
      margin: 4,
    });
    const fileUrl = `${ast.fileUrl ? ast.fileUrl : 'Template String'}:${ul.lineNumber}:${ul.columnNumber}`;
    const error = new Error(errMsg.replace(scopeRE, ''));
    error.stack = ['', '',
      fileUrl, '',
      ul.text, '',
      error.stack,
    ].join('\n');
    return error;
  },

  throw(errMsg, el) {
    throw (el && el._ast) ? this.genError(errMsg, el) : new Error(errMsg);
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
