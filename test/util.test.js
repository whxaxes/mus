'use strict';

const utils = require('../lib/utils');
const assert = require('power-assert');

describe('lib#utils', () => {
  it('forEach should run without error', () => {
    utils.forEach({ a: 1, b: 2 }, (value, key, index, len) => {
      if (index === 0) {
        assert(key === 'a');
        assert(value === 1);
      } else {
        assert(key === 'b');
        assert(value === 2);
      }

      assert(len === 2);
    });

    utils.forEach([1, 2], (value, key, index, len) => {
      if (index === 0) {
        assert(value === 1);
      } else {
        assert(value === 2);
      }

      assert(key === index);
      assert(len === 2);
    });

    utils.forEach(null, (value, key, index, len) => {
      throw new Error('should not exec null forEach!!');
    });
  });

  it('cache should run without error', () => {
    assert(utils.cache('asd', 123) === 123);
    assert(utils.cache('asd', 444) === 123);
    assert(utils.cache('asdd', () => 123) === 123);
  });

  it('reStringFormat should run without error', () => {
    assert(utils.reStringFormat('$^?{}()') === '\\$\\^\\?\\{\\}\\(\\)');
  });

  it('escape should run without error', () => {
    assert(utils.escape('<>') === '&lt;&gt;');
  });
});