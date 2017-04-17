const compiler = require('../lib/compile/compile');

describe('lib#compile', () => {
  it('should run without error if ast.root is not exist', () => {
    compiler({});
    compiler({ root: [] });
  });

  it('should run without error if astNode has error type', () => {
    compiler({ root: [{ type: 4 }] });
    compiler({ root: [{ type: 1 }] });
  });
});
