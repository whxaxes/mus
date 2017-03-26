'use strict';

const filters = require('../lib/utils/filters');
const assert = require('power-assert');

describe('lib#utils#filters.js', () => {
  it('nl2br should run without error', () => {
    assert(filters.nl2br('\n') === '<br/>')
  });

  it('json should run without error', () => {
    assert(filters.json({ a: 'ss' }) === '{"a":"ss"}');
    assert(filters.json(null) === '{}');
  });

  it('reverse should run without error', () => {
    assert(filters.reverse([1, 2])[0] === 2);
  });

  it('replace should run without error', () => {
    assert(filters.replace('abc', 'c', 'b') === 'abb');
  });

  it('abs should run without error', () => {
    assert(filters.abs(-1) === 1);
  });

  it('join should run without error', () => {
    assert(filters.join([1, 2, 3]) === '123');
    assert(filters.join([1, 2, 3], '+') === '1+2+3');
  });

  it('lower should run without error', () => {
    assert(filters.lower('Abc') === 'abc');
  });

  it('upper should run without error', () => {
    assert(filters.upper('Abc') === 'ABC');
  });

  it('slice should run without error', () => {
    assert(filters.slice([1, 2, 3], 1)[0] === 2);
  });

  it('trim should run without error', () => {
    assert(filters.trim('  asd ') === 'asd');
  });
});