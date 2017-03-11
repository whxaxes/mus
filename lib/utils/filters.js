'use strict';
const utils = require('./utils');

module.exports = {
  nl2br(str) {
    if (typeof str === 'string') {
      return str.replace(/\r|\n|\r\n/g, '<br/>');
    } else {
      return '';
    }
  },

  json(obj) {
    if (!obj) {
      return '{}';
    }

    return JSON.stringify(obj);
  },

  escape(str) {
    return utils.escape(str);
  },

  reverse(arr) {
    return arr.reverse();
  }
};
