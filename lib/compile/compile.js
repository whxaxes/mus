'use strict';
const utils = require('../utils/utils');
const globalFilters = require('../utils/filters');
let currentMus;

class Compiler {
  constructor({ ast, scope = {}, ecomp }) {
    this.ast = ast;
    this.scope = scope;
    // compiler which extends this
    this.ecomp = ecomp;
  }

  compile(ast = this.ast, scope = this.scope) {
    if (ast.extends) {
      const fileUrl = computed(ast.extends, scope);
      const parentAst = currentMus.getAstByUrl(fileUrl);
      return new Compiler({
        ast: parentAst,
        scope: Object.assign({}, scope),
        ecomp: this,
      }).compile();
    } else {
      return this.processAst(ast.root, scope);
    }
  }

  processAst(root, scope) {
    if (!root || !root.length) {
      return '';
    }

    let html = '';
    let i = 0;
    while (i < root.length) {
      const el = root[i];
      // istanbul ignore else
      if (el.type === 2) {
        // text handling
        html += el.text;
      } else if (el.type === 3) {
        // variable handling
        html += this.processVariable(el, scope);
      } else if (el.type === 1) {
        // block handling
        if (el.for) {
          html += this.processFor(el, scope);
        } else if (el.if) {
          html += this.processIf(el, scope);
        } else if (el.set) {
          scope[el.key] = computed(el, scope);
        } else if (el.block) {
          html += this.processBlock(el, scope);
        } else if (el.include) {
          html += this.processInclude(el, scope);
        }
      }

      i++;
    }
    return html;
  }

  processVariable(el, scope) {
    if (el.method && this.ast.macro && this.ast.macro.has(el.method)) {
      const macroEl = this.ast.macro.get(el.method);
      scope[el.method] = macroEl.genRender(
        Object.assign({}, scope), // use new scope
        scope => this.processAst(macroEl.children, scope)
      );
    }

    const result = computed(el, scope);
    return el.safe ? result : utils.escape(result);
  }

  processInclude(el, scope) {
    const args = el.argsFunc(scope);
    const fileUrl = args._url;
    if (!fileUrl) {
      utils.throw('include url invalid!', el);
    }
    const includeAst = currentMus.getAstByUrl(fileUrl);
    return new Compiler({
      ast: includeAst,
      scope: Object.assign({}, this.scope, args),
    }).compile();
  }

  processBlock(el, scope) {
    const extendBlock = this.ecomp
      && this.ecomp.ast.blocks
      && this.ecomp.ast.blocks.get(el.name);

    if (extendBlock) {
      return this.ecomp.processAst(extendBlock.children);
    } else {
      return this.processAst(el.children, scope);
    }
  }

  processFor(el, scope) {
    let html = '';
    let loopScope;
    const result = computed(el, scope);
    utils.forEach(result, (value, key, index, len) => {
      loopScope = loopScope || Object.assign({}, scope);
      loopScope[el.value] = value;
      loopScope.loop = {
        index: index + 1,
        index0: index,
        length: len,
      };

      if (el.index) {
        loopScope[el.index] = key;
      }

      html += this.processAst(el.children, loopScope);
    });
    return html;
  }

  processIf(el, scope) {
    // check if
    if (computed(el, scope)) {
      return this.processAst(el.children, scope);
    } else {
      // check else if
      if (el.elseifBlock) {
        let j = 0;
        while (j < el.elseifBlock.length) {
          const elseifBlock = el.elseifBlock[j];
          if (computed(elseifBlock, scope)) {
            return this.processAst(elseifBlock.children, scope);
          }

          j++;
        }
      }

      // check else
      if (el.elseBlock) {
        return this.processAst(el.elseBlock.children, scope);
      }
    }

    return '';
  }
}

function processFilter(filterName) {
  const filter = currentMus.filters[filterName] || globalFilters[filterName];

  if (!filter) {
    throw new Error(`unknown filter ${filterName}`);
  }

  return filter;
}

function computed(obj, scope, el) {
  let result;

  try {
    result = obj.render(scope, processFilter);
  } catch (e) {
    // only catch the not defined error
    if (e.message.indexOf('is not defined') >= 0) {
      result = '';
    } else {
      utils.throw(e.message, el || obj);
    }
  }

  return result;
}

module.exports = function(ast, scope, mus) {
  currentMus = mus;

  // process ast
  const html = new Compiler({ ast, scope }).compile();

  currentMus = null;

  return html;
};
