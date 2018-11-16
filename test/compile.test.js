const compiler = require('../lib/compile/compile');

describe('lib#compile', () => {
  it('should run without error if ast.root is not exist', () => {
    compiler({}, undefined, {});
    compiler({ root: [] }, undefined, {});
  });

  it('should run without error if astNode has error type', () => {
    compiler({ root: [{ type: 4 }] }, undefined, {});
    compiler({ root: [{ type: 1 }] }, undefined, {});
  });
});
