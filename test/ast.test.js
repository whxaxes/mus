'use strict';

const Ast = require('../lib/compile/ast');
const assert = require('power-assert');

describe('lib#compile#ast', () => {
  it('scanIndex should correct', () => {
    const str = 'abc{{ test }} \n aaa{% if test %}{{ abc }}{% endif %}';
    const ast = new Ast(str);
    assert(ast.root[1]._index === str.indexOf('{{'));
    assert(ast.root[3]._index === str.indexOf('{%'));
    assert(ast.root[3].children[0]._index === str.indexOf('{{ abc }}'));
  });
});
