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
      for (let key in obj) {
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

  escape(str) {
    return String(str).replace(entityRE, s => entityMap[s]);
  },

  nlEscape(str) {
    return str.replace(/\r?\n/, '\\n');
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
  }
};
