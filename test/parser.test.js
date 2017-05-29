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

    it('should parse complex expression without error', () => {
      const result = parser.parseAttr('a = `${bb.xx}11`')(obj);
      assert(result.a === '211');
    });

    it('should parse default string with key-value without error', () => {
      const result = parser.parseAttr('bb.xx + "aa\'aa" myGod=BBB')(obj);
      assert(result.default === '2aa\'aa');
      assert(result.myGod === 33);
    });
  });

  describe('parseMacroExpr', () => {
    it('should parse macro expression without error', () => {
      parser.parseMacroExpr('test(name)')
        .genRender({}, scope => {
          assert(scope.name === '123');
        })('123');
    });

    it('should parse default value without error', () => {
      parser.parseMacroExpr('test(name, cc = 11)')
        .genRender({}, scope => {
          assert(scope.name === '123');
          assert(scope.cc === 11);
        })('123');
      parser.parseMacroExpr('test(name, cc = "11", bb, aa = test)')
        .genRender({ test: 'g' }, scope => {
          assert(scope.name === '123');
          assert(scope.bb === '11');
          assert(scope.cc === null);
          assert(scope.aa === 'g');
        })('123', null, '11');
    });

    it('should parse complex expression without error', () => {
      parser.parseMacroExpr('test(a = `${a}11`)')
        .genRender({ a: 123 }, scope => {
          assert(scope.a === '12311');
        })();
    });

    it('should throw error if expression illegal', done => {
      try {
        parser.parseMacroExpr('test(a = [ 123 })')
          .genRender({ a: 123 }, scope => {
            assert(scope.a === '12311');
          })();
      } catch (e) {
        done();
      }
      throw new Error('not throw error');
    });

    it('should parse default object without error', () => {
      parser.parseMacroExpr('test(name, cc = { abc: 11, bbb: 11, ccc: a = bb }, bb, aa = test)')
        .genRender({ test: 'g', bb: '111' }, scope => {
          assert(scope.name === '123');
          assert(scope.cc.ccc === '111');
          assert(scope.aa === 'g');
        })('123');
      parser.parseMacroExpr('test(name, cc = [1, 2])')
        .genRender({}, scope => {
          assert(scope.name === '123');
          assert(scope.cc[0] === 1);
        })('123');
      parser.parseMacroExpr('test(name, cc = [[1, 2], 2])')
        .genRender({}, scope => {
          assert(scope.name === '123');
          assert(scope.cc[0][1] === 2);
        })('123');
    });
  });

  describe('splitOperator', () => {
    it('should parse simple expression without error', () => {
      assert(find(parser.splitOperator('abc'), '_$o.abc'));
      assert(find(parser.splitOperator(' "abc"'), '"abc"'));
      assert(find(parser.splitOperator('null'), 'null'));
      assert(find(parser.splitOperator('(abc_s > a && b) ? obj.aa: bb.xx'), '_$o.bb.xx'));
    });

    it('should parse complex expression without error', () => {
      let result = parser.splitOperator('f.say + abc + 66 === nihao');
      assert(find(result, '_$o.f.say'));
      assert(find(result, '+'));
      assert(find(result, '_$o.abc'));
      assert(find(result, '66'));
      assert(find(result, '==='));
      assert(find(result, '_$o.nihao'));

      result = parser.splitOperator('"cool + 123" + b.sa  ? b.sa : a.sb');
      assert(find(result, '"cool + 123"'));
      assert(find(result, '_$o.b.sa'));
      assert(find(result, '_$o.b.sa'));
      assert(find(result, '_$o.a.sb'));

      result = parser.splitOperator('absc[ "nihao" + say] + you');
      assert(find(result, '_$o.absc'));
      assert(find(result, '_$o.say'));
      assert(find(result, '_$o.you'));

      result = parser.splitOperator('(abc_s > a && b) ? !obj.aa: bb.xx');
      assert(find(result, '_$o.abc_s'));
      assert(find(result, '_$o.a'));
      assert(find(result, '_$o.b'));
      assert(find(result, '_$o.obj.aa'));
      assert(find(result, '_$o.bb.xx'));
    });

    it('should parse function string without error', () => {
      let result = parser.splitOperator('tell("nihao", true, 123, b.sasa)');
      assert(find(result, '_$o.tell'));
      assert(find(result, '123'));
      assert(find(result, '_$o.b.sasa'));
    });

    it('should parse function string without error', () => {
      let result = parser.splitOperator(`a = bbb cc = 111`);
      assert(find(result, '_$o.a'));
      assert(find(result, '_$o.bbb'));
      assert(find(result, '_$o.cc'));
      assert(find(result, '111'));

      result = parser.splitOperator(`{
        test: 123,
        bb: you === sb,
        [so]: {
          fuck: 1111,
          cc: 233
        }
      }`);
      assert(find(result, 'test'));
      assert(find(result, 'bb'));
      assert(find(result, '_$o.you'));
      assert(find(result, '_$o.sb'));
      assert(find(result, '_$o.so'));
      assert(find(result, 'fuck'));
      assert(find(result, 'cc'));
    });

    it('should parse special operator correct', () => {
      let result = parser.splitOperator('abc_s and not boo or you');
      assert(find(result, '_$o.abc_s'));
      assert(find(result, '&&'));
      assert(find(result, '_$o.boo'));
      assert(find(result, '||'));
      assert(find(result, '_$o.you'));
    });

    it('should parse object string without error', () => {
      let result = parser.splitOperator('{\r\n abc: `asd${bbb[aa + "bb"]}` \r\n}');
      assert(find(result, '_$o.bbb'));
      assert(find(result, '_$o.aa'));
      assert(find(result, '"bb"'));
      assert(find(result, 'abc'));
    });

    it('should parse regexp string without error', () => {
      let result = parser.splitOperator('r/[1-6]/ig.test(youku)');
      assert(find(result, '/[1-6]/ig'));
      assert(find(result, '.test'));
      assert(find(result, '_$o.youku'));

      result = parser.splitOperator('"test".replace(r/^https?.*/i, "")');
      assert(find(result, '"test"'));
      assert(find(result, '/^https?.*/i'));
      assert(find(result, '.replace'));

      result = parser.splitOperator(`"test".replace(r/^ht\\/tps?.*/i, "")`);
      assert(find(result, '/^ht\\/tps?.*/i'));
      assert(find(result, '.replace'));
    });
  });
});

function find(result, str) {
  for (let i = 0; i < result.fragments.length; i++) {
    if (result.fragments[i].type === 'prop') {
      if (`_$o.${result.fragments[i].expr}` === str) {
        return true;
      }
    } else if (result.fragments[i].expr === str) {
      return true;
    }
  }
  return false;
}