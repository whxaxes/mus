'use strict';
const utils = require('./utils');

module.exports = {
  nl2br(input) {
    return utils.nl2br(input);
  },

  json(input) {
    if (!input) {
      return '{}';
    }

    return JSON.stringify(input);
  },

  escape(input) {
    return utils.escape(input);
  },

  reverse(input) {
    return [].reverse.call(input);
  },

  replace(input, key, newKey) {
    return input.replace(key, newKey || '');
  },

  abs(input) {
    return Math.abs(input);
  },

  join(input, key = '') {
    return [].join.call(input, key);
  },

  lower(input) {
    return ''.toLowerCase.call(input);
  },

  upper(input) {
    return ''.toUpperCase.call(input);
  },

  slice(input, start, end) {
    return [].slice.call(input, start, end);
  },

  trim(input) {
    return ''.trim.call(input);
  },
};
