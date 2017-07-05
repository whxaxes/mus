'use strict';
const utils = require('../utils/utils');
const processor = require('./processor');
const tagNameRE = /(end)?(\w+)/;
let mus;

class Ast {
  constructor(html, options = {}, fileUrl) {
    this.root = [];
    this.parent = null;
    this.scanIndex = 0;
    this.endIndex = 0;
    this.template = html;
    this.fileUrl = fileUrl;
    this.blockStart = options.blockStart || '{%';
    this.blockEnd = options.blockEnd || '%}';
    this.variableStart = options.variableStart || '{{';
    this.variableEnd = options.variableEnd || '}}';
    this.processor = processor;
    this.commentStart = '{#';
    this.commentEnd = '#}';

    // support extending processor
    if (options.processor) {
      this.processor = Object.assign({}, processor, options.processor);
    }

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

    let leftStart;
    let isRaw;
    let element;
    let isTag = false;
    let isComment = false;
    let collector = this.genCollector();
    const parent = this.parent;
    const matches = str.match(this.startRegexp);

    if (matches) {
      this.endIndex = matches.index;
      leftStart = matches[0];
      isTag = leftStart === this.blockStart;
      isComment = leftStart === this.commentStart;
    } else {
      this.endIndex = str.length;
    }

    const chars = str.substring(0, this.endIndex);
    if (chars.length) {
      collectChars(collector, chars);
    }

    if (!matches) {
      // parse end
      if (parent) {
        utils.warn(`${parent.tag} was not closed`, parent);
      }
      return;
    }

    // get blockEnd or the other
    const rightEnd = isTag ? this.blockEnd : isComment ? this.commentEnd : this.variableEnd;
    str = this.advance(str, this.endIndex);

    // get rightEnd index
    this.endIndex = str.indexOf(rightEnd);
    const expression = str.substring(leftStart.length, this.endIndex);

    if (isComment) {
      // handle comment
      this.endIndex = this.endIndex >= 0 ? (this.endIndex + rightEnd.length) : str.length;
    } else if (this.endIndex < 0 || expression.indexOf(leftStart) >= 0) {
      // handle text
      collectChars(collector, leftStart);
      this.endIndex = leftStart.length;
    } else {
      // handle block or variable
      this.endIndex = this.endIndex + rightEnd.length;

      isRaw = parent && parent.raw;
      if (isTag) {
        if (!isRaw) {
          const matches = expression.match(tagNameRE);
          const tagName = matches[0];
          const isCustom = mus && mus.customTags.has(tagName);
          const tagHandle = this.processor[tagName]
            || (isCustom ? this.processor.custom : null);

          if (tagHandle) {
            // create ast node
            element = this.genNode(1, expression.substring(matches.index + tagName.length).trim());
            element[tagName] = true;
            element.tag = tagName;
            tagHandle(element, isCustom ? mus.customTags.get(tagName) : null);

            if (!element.isUnary) {
              this.parent = element;
            }
          } else if (matches[1]) {
            this.closeTag(matches[2]);
          } else {
            utils.throw(`unknown tag '${expression.trim()}'`, this.genNode(null));
          }
        } else if (expression.trim() === 'endraw') {
          // save raw's text node to parent's children
          const rawEl = this.closeTag('raw');
          collector = this.genCollector();
          element = rawEl.children[0];
        } else {
          collectChars(collector, leftStart + expression + rightEnd);
        }
      } else {
        if (isRaw) {
          collectChars(collector, leftStart + expression + rightEnd);
        } else {
          element = this.genNode(3, expression);
          this.processor.variable(element);
        }
      }

      if (element && !element.isAlone) {
        collector.push(element);
      }
    }

    this.parse(this.advance(str, this.endIndex));
  }

  genNode(type, expr) {
    return {
      type,
      parent: this.parent,
      _expr: expr,
      _index: this.scanIndex,
      _len: this.endIndex,
      _ast: this,
    };
  }

  genMacro() {
    if (!this.macro) {
      this.macro = new Map();
    }

    return this.macro;
  }

  advance(str, index) {
    this.scanIndex += index;
    return str.substring(index);
  }

  genCollector() {
    return this.parent
      ? (this.parent.children = this.parent.children || [])
      : this.root;
  }

  // close block
  // change current parent
  closeTag(tagName) {
    const p = this.parent;
    if (p) {
      this.parent = this.parent.parent;

      if (p.tag !== tagName) {
        if (!p.else && !p.elseif) {
          utils.warn(`${p.tag} was not closed`, p);
        }
        return this.closeTag(tagName);
      } else {
        return p;
      }
    }
  }
}

function collectChars(collector, str) {
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

module.exports = function(html, options, fileUrl, musObj) {
  mus = musObj;
  const ast = new Ast(html, options, fileUrl);
  mus = null;
  return ast;
};
