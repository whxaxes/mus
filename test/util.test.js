'use strict';

const utils = require('../lib/utils/utils');
const assert = require('power-assert');

describe('lib#utils#utils.js', () => {
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

  it('should throw friendly error', () => {
    const temp = '{{ 01112131415161718192021\n22232425262728293031\n323334353637383940 }}';
    const template = `abcabcb\naasdas\nd  ${temp}\n asdas\ndasssssss\nssasdasdasdasdasdasdssssssssssssssssssssssssssss`;
    let stack;
    try {
      utils.throw('testest', {
        _ast: { template, fileUrl: 'test/test.tpl' },
        _index: template.indexOf('{{'),
        _len: temp.length,
      });
    } catch (e) {
      stack = e.stack;
    }
    const arrows = stack.match(/\^+/g);
    const strList = temp.split('\n');
    assert(stack.indexOf('test/test.tpl') >= 0);
    assert(arrows.length === strList.length);
    strList.forEach((str, index) => {
      assert(arrows[index].length === str.length);
    });
  });

  it('should throw error correctly without el', () => {
    try {
      utils.throw('error error');
    } catch (e) {
      assert(e.message.indexOf('error error') >= 0);
      return;
    }
    throw new Error('not cache error');
  });
});