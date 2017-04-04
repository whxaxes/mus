'use strict';

const parser = require('../lib/compile/parser');
const assert = require('power-assert');
const obj = {
  obj: { aa: 1 },
  bb: { xx: 2 },
  BBB: 33,
  AAA: 11,
};

describe('lib#compile#parser', () => {
  describe('parseArgs', () => {
    it('should parse single key-value without error', () => {
      const result = parser.parseArgs('abc = obj.aa + bb.xx')(obj);
      assert(result.default === undefined);
      assert(result.abc === 3);
    });

    it('should parse multi key-value without error', () => {
      const result = parser.parseArgs('abc = obj.aa + bb.xx myGod=BBB yourGod= AAA + BBB')(obj);
      assert(result.default === undefined);
      assert(result.abc === 3);
      assert(result.myGod === 33);
      assert(result.yourGod === 44);
    });

    it('should parse string with key-value without error', () => {
      const result = parser.parseArgs('abc = "obj.aa = " + bb.xx myGod=BBB')(obj);
      assert(result.default === undefined);
      assert(result.abc === 'obj.aa = 2');
      assert(result.myGod === 33);
    });

    it('should parse default string without error', () => {
      const result = parser.parseArgs('"asd33=aaaa"')(obj);
      assert(result.default === 'asd33=aaaa');
    });

    it('should parse default string with key-value without error', () => {
      const result = parser.parseArgs('bb.xx + "aa\'aa" myGod=BBB')(obj);
      assert(result.default === '2aa\'aa');
      assert(result.myGod === 33);
    });
  });
  
});
