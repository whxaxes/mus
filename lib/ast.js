'use strict';
const utils = require('./utils');

const forTagRE = /^for\s+(\w+)(?:\s*,\s*(\w+))?\s*in\s([\s\S]+)$/;
const ifTagRE = /^if\s+([\s\S]+)$/;
const elseTagRE = /^else(?:(if)\s+([\s\S]+))?/;
const setTagRE = /^set\s+(\w+)\s*=([\s\S]+)$/;
const endTagRE = /^end(for|if|macro)/;
const macroTagRE = /^macro\s+(\w+)(?:\(([\w,\s]+?)\))?\s*$/;
const filterRE = /(?:\|\s*\w+\s*)+$/;
const filterSplitRE = /\s*\|\s*/;

// match obj.test | '123' | 123
const objectRE = /^\w+(?:(?:\.|\[)[\w\-'"]+(?:\])?)*$/;
const stringRE = /^(?:'|")[^'"]*?(?:'|")$/;
const numberRE = /^\d+$/;
const functionRE = /^(\w+)\(/;

class Ast {
  constructor(html, options = {}) {
    this.root = [];
    this.macro = new Map();
    this.parent = null;
    this.blockStart = options.blockStart || '{%';
    this.blockEnd = options.blockEnd || '%}';
    this.variableStart = options.variableStart || '{{';
    this.variableEnd = options.variableEnd || '}}';
    this.commentStart = '{#';
    this.commentEnd = '#}';

    if (this.blockStart === this.variableStart) {
      throw new Error('blockStart should be different with variableStart!');
    }

    // create a regexp used to match leftStart
    this.startRegexp = utils.cache(
      `symbol_${this.blockStart}_${this.variableStart}_${this.commentStart}`,
      () => {
        // make sure can match the longest start string at first
        const str = [this.blockStart, this.variableStart, this.commentStart]
          .sort((a, b) => (a.length > b.length ? -1 : 1))
          .map(item => utils.reStringFormat(item))
          .join('|');
        return new RegExp(str);
      }
    );

    this.parse(html);
  }

  parse(str) {
    if (!str) {
      return;
    }

    let endIndex;
    let leftStart;
    let rightEnd;
    let isRaw;
    let element;
    let isBlock = false;
    let isComment = false;
    const root = this.root;
    const parent = this.parent;
    const collector = parent ? parent.children : root;
    const matches = str.match(this.startRegexp);

    if (matches) {
      endIndex = matches.index;
      leftStart = matches[0];
      isBlock = leftStart === this.blockStart;
      isComment = leftStart === this.commentStart;
    } else {
      endIndex = str.length;
    }

    const chars = str.slice(0, endIndex);
    if (chars.length) {
      processChars(collector, chars);
    }

    if (!matches) {
      // parse end
      return;
    }

    // get blockEnd or the other
    rightEnd = isBlock ? this.blockEnd : isComment ? this.commentEnd : this.variableEnd;
    str = str.slice(endIndex);

    // get rightEnd index
    endIndex = str.indexOf(rightEnd);
    let expression = str.slice(leftStart.length, endIndex);

    if (isComment) {
      // handle comment
      endIndex = endIndex >= 0 ? (endIndex + rightEnd.length) : str.length;
    } else if (endIndex < 0 || expression.indexOf(leftStart) >= 0) {
      // handle text
      processChars(collector, leftStart);
      endIndex = leftStart.length;
    } else {
      // handle block or variable
      endIndex = endIndex + rightEnd.length;

      isRaw = parent && parent.raw;
      if (isBlock) {
        if (!isRaw) {
          expression = expression.trim();

          const el = {
            type: 1,
            children: [],
            parent,
          };

          const result = processFor(expression, el, this)
            || processIf(expression, el, this)
            || processElse(expression, el, this)
            || processSet(expression, el, this)
            || processRaw(expression, el, this)
            || processMacro(expression, el, this);

          if (result) {
            if (el.children) {
              this.parent = el;
            }

            element = el;
          } else if (endTagRE.test(expression)) {
            this.closeTag(RegExp.$1);
          } else {
            throw new Error(`unknown block ${expression}`);
          }
        } else if (expression.trim() === 'endraw') {
          this.closeTag('raw');
        } else {
          processChars(collector, leftStart + expression + rightEnd);
        }
      } else {
        if (isRaw) {
          processChars(collector, leftStart + expression + rightEnd);
        } else {
          element = processExpression(expression, { type: 3 });

          if (functionRE.test(element.expression)) {
            element.methodName = RegExp.$1;
          }
        }
      }

      if (element && !element.collected) {
        collector.push(element);
      }
    }

    this.parse(str.slice(endIndex));
  }

  // close block
  // change current parent
  closeTag(tagName) {
    const p = this.parent;
    if (p) {
      this.parent = this.parent.parent;

      if (p.tag !== tagName) {
        return this.closeTag(tagName);
      } else {
        return p;
      }
    }
  }
}

function processChars(collector, str) {
  const lastEl = collector[collector.length - 1];
  if (lastEl && lastEl.type === 2) {
    lastEl.text += str;
  } else {
    collector.push({
      text: str,
      type: 2,
    });
  }
}

function processFor(expr, el) {
  if (!forTagRE.test(expr)) {
    return;
  }

  el.for = true;
  el.tag = 'for';
  el.value = RegExp.$1;
  el.index = RegExp.$2;
  processExpression(RegExp.$3, el);
  return el;
}

function processIf(expr, el) {
  if (!ifTagRE.test(expr)) {
    return;
  }

  el.if = true;
  el.tag = 'if';
  processExpression(RegExp.$1 || '', el);
  return el;
}

function processElse(expr, el) {
  if (!elseTagRE.test(expr)) {
    return;
  }

  const parent = el.parent;
  const ifEl = parent.ifBlock || parent;

  if (!ifEl.if) {
    throw new Error('parse error, if block not found');
  }

  // parent of else and elseif 
  // should the same as ifBlock's 
  el.ifBlock = el.parent = ifEl;

  if (RegExp.$1) {
    if (parent.else) {
      throw new Error('parse error, else behind elseif');
    }

    el.elseif = true;
    processExpression(RegExp.$2 || '', el);
    ifEl.elseifBlock = ifEl.elseifBlock || [];
    ifEl.elseifBlock.push(el);
  } else {
    el.else = true;
    ifEl.elseBlock = el;
  }

  // else and elseif block don't need collect 
  el.collected = true;
  return el;
}

function processSet(expr, el) {
  if (!setTagRE.test(expr)) {
    return;
  }

  el.set = true;
  el.tag = 'set';
  el.key = (RegExp.$1 || '').trim();
  el.children = null;
  processExpression(RegExp.$2, el);
  return el;
}

function processRaw(expr, el) {
  if (expr !== 'raw') {
    return;
  }

  el.tag = 'raw';
  el.raw = true;
  return el;
}

function processMacro(expr, el, ast) {
  if (!macroTagRE.test(expr)) {
    return;
  }

  el.macro = true;
  el.tag = 'macro';
  el.item = RegExp.$1;
  el.args = RegExp.$2;
  el.collected = true;
  ast.macro.set(el.item, el);
  return el;
}

function processExpression(expr, el) {
  const matches = expr.match(filterRE);
  let result = expr;

  if (matches) {
    result = result.slice(0, matches.index);
    el.filters = matches[0].trim()
      .split(filterSplitRE)
      .filter(filter => (filter === 'safe')
        ? ((el.safe = true) && false)
        : !!filter);
  }

  el.expression = result.trim();

  // guess the expression's type 
  // it use to decide which way to render expression
  if (stringRE.test(el.expression)) {
    el.isString = true;
  } else if (numberRE.test(el.expression)) {
    el.isNumber = true;
  } else {
    el.isObject = objectRE.test(el.expression);
  }

  return el;
}

module.exports = Ast;
