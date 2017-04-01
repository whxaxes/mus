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

  it('calculateLines should run without error', () => {
    let str = 'abc\ncca\nc\r\n{{';

    let lineObj = utils.calculateLines(str, 8);
    assert(lineObj.line === 3);
    assert(lineObj.index === 1);

    lineObj = utils.calculateLines(str, 10);
    assert(lineObj.line === 4);
    assert(lineObj.index === 0);

    lineObj = utils.calculateLines(str, 5);
    assert(lineObj.line === 2);
    assert(lineObj.index === 2);

    lineObj = utils.calculateLines(str, 2);
    assert(lineObj.line === 1);
    assert(lineObj.index === 3);

    lineObj = utils.calculateLines(str, str.indexOf('{{'));
    assert(lineObj.line === 4);
    assert(lineObj.index === 1);
  });
  
  it('throw friendly error', () => {
    const temp = '{{ 01112131415161718192021\n22232425262728293031\n323334353637383940 }}';
    const template = `abcabcb\naasdas\nd  ${temp}\n asdas\ndasssssss\nssasdasdasdasdasdasdssssssssssssssssssssssssssss`;
    const stack = utils.genError('testest', {
      _ast: { template, fileUrl: 'test/test.tpl' },
      _index: template.indexOf('{{'),
      _len: temp.length,
    }).stack;
    const arrows = stack.match(/\^+/g);
    const strList = temp.split('\n');
    assert(stack.indexOf('test/test.tpl') >= 0);
    assert(arrows.length === strList.length);
    strList.forEach((str, index) => {
      assert(arrows[index].length === str.length);  
    });
  })
});