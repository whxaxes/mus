const compiler = require('../lib/compile/compile');

describe('lib#compile', () => {
  it('should run without error if ast.root is not exist', () => {
    compiler({});
    compiler({ root: [] });
  });
});
