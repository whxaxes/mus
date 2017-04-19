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
  describe('parseAttr', () => {
    it('should parse single key-value without error', () => {
      const result = parser.parseAttr('abc = obj.aa + bb.xx')(obj);
      assert(result.default === undefined);
      assert(result.abc === 3);
    });

    it('should parse multi key-value without error', () => {
      const result = parser.parseAttr('abc = obj.aa + bb.xx myGod=BBB yourGod= AAA + BBB')(obj);
      assert(result.default === undefined);
      assert(result.abc === 3);
      assert(result.myGod === 33);
      assert(result.yourGod === 44);
    });

    it('should parse object value without error', () => {
      const result = parser.parseAttr('abc = { 1: 123 } myGod=BBB yourGod= AAA + BBB')(obj);
      assert(result.default === undefined);
      assert(result.abc[1] === 123);
      assert(result.myGod === 33);
      assert(result.yourGod === 44);
    });

    it('should parse string with key-value without error', () => {
      const result = parser.parseAttr('abc = "obj.aa = " + bb.xx myGod=BBB')(obj);
      assert(result.default === undefined);
      assert(result.abc === 'obj.aa = 2');
      assert(result.myGod === 33);
    });

    it('should parse key-value without expression without error', () => {
      const result = parser.parseAttr('abc = obj.aa === bb.xx cool = bb.xx/2')(obj);
      assert(result.abc === false);
      assert(result.cool === 1);
    });

    it('should parse default string without error', () => {
      const result = parser.parseAttr('"asd33=aaaa"')(obj);
      assert(result.default === 'asd33=aaaa');
    });

    it('should parse default string with key-value without error', () => {
      const result = parser.parseAttr('bb.xx + "aa\'aa" myGod=BBB')(obj);
      assert(result.default === '2aa\'aa');
      assert(result.myGod === 33);
    });
  });

  describe('parseString', () => {
    it('should parse simple expression without error', () => {
      assert(find(parser.parseString('abc').list, '_$o.abc'));
      assert(find(parser.parseString(' "abc"').list, '"abc"'));
      assert(find(parser.parseString('null').list, 'null'));
      assert(parser.parseString('(abc_s > a && b) ? obj.aa: bb.xx').list.pop().newExpr === '_$o.bb.xx');
    });

    it('should parse complex expression without error', () => {
      let result = parser.parseString('f.say + abc + 66 === nihao');
      assert(!result.needWith);
      assert(find(result.list, '_$o.f.say'));
      assert(find(result.list, ' + '));
      assert(find(result.list, '_$o.abc'));
      assert(find(result.list, '66'));
      assert(find(result.list, '_$o.nihao'));

      result = parser.parseString('"cool + 123" + b.sa  ? b.sa : a.sb');
      assert(!result.needWith);
      assert(find(result.list, '"cool + 123"'));
      assert(find(result.list, '_$o.b.sa'));
      assert(find(result.list, '_$o.b.sa'));
      assert(find(result.list, '_$o.a.sb'));

      result = parser.parseString('absc[ "nihao" + say] + you');
      assert(!result.needWith);
      assert(find(result.list, '_$o.absc'));
      assert(find(result.list, '_$o.say'));
      assert(find(result.list, '_$o.you'));

      result = parser.parseString('(abc_s > a && b) ? !obj.aa: bb.xx');
      assert(!result.needWith);
      assert(find(result.list, '_$o.abc_s'));
      assert(find(result.list, '_$o.a'));
      assert(find(result.list, '_$o.b'));
      assert(find(result.list, '_$o.obj.aa'));
      assert(find(result.list, '_$o.bb.xx'));
    });

    it('should parse function string without error', () => {
      let result = parser.parseString('tell("nihao", true, 123, b.sasa)');
      assert(!result.needWith);
      assert(find(result.list, '_$o.tell'));
      assert(find(result.list, '123'));
      assert(find(result.list, '_$o.b.sasa'));
    });

    it('should parse special operator correct', () => {
      let result = parser.parseString('abc_s and not boo or you');
      assert(find(result.list, '_$o.abc_s'));
      assert(find(result.list, ' && ! '));
      assert(find(result.list, '_$o.boo'));
      assert(find(result.list, ' || '));
      assert(find(result.list, '_$o.you'));
    });

    it('should parse object string without error', () => {
      let result = parser.parseString('{ abc: nihao }');
      assert(result.needWith);
    });
  });
});

function find(list, str) {
  for (let i = 0; i < list.length; i++) {
    if (list[i].newExpr === str || list[i].expr === str) {
      return true;
    }
  }
  return false;
}