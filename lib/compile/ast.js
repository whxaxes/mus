'use strict';
const utils = require('../utils/utils');
const processor = require('./processor');
const tagNameRE = /(end)?(\w+)/;
let mus;

class Ast {
  constructor(html, options = {}, fileUrl) {
    this.root = [];
    this.parent = null;
    this.macro = new Map();
    this.extends = null;
    this.scanIndex = 0;
    this.endIndex = 0;
    this.template = html;
    this.fileUrl = fileUrl;
    this.blockStart = options.blockStart || '{%';
    this.blockEnd = options.blockEnd || '%}';
    this.variableStart = options.variableStart || '{{';
    this.variableEnd = options.variableEnd || '}}';
    this.trimBlocks = options.trimBlocks;
    this.lstripBlocks = options.lstripBlocks;
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
    let element;
    let isTag = false;
    let isComment = false;
    const collector = this.genCollector();
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

    this.collectChars(str.substring(0, this.endIndex));
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
      // comment
      element = this.genNode(4, leftStart + expression + rightEnd);
      element.comment = true;
      this.processor.comment(element);
      this.endIndex = this.endIndex >= 0 ? (this.endIndex + rightEnd.length) : str.length;
    } else if (this.endIndex < 0 || expression.indexOf(leftStart) >= 0) {
      // text
      this.collectChars(leftStart);
      this.endIndex = leftStart.length;
    } else {
      this.endIndex = this.endIndex + rightEnd.length;

      if (parent && parent.raw) {
        // raw
        if (isTag && expression.trim() === 'endraw') {
          this.closeTag('raw');
        } else {
          this.collectChars(leftStart + expression + rightEnd);
        }
      } else if (isTag) {
        // tag
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
          tagHandle.apply(
            this.processor,
            [element, isCustom ? mus.customTags.get(tagName) : null]
          );

          if (!element.isUnary) {
            this.parent = element;
          }
        } else if (matches[1]) {
          this.closeTag(matches[2]);
        } else {
          utils.throw(`unknown tag '${expression.trim()}'`, this.genNode(null));
        }
      } else {
        // variable
        element = this.genNode(3, expression);
        this.processor.variable(element);
      }
    }

    if (element) {
      // trim end
      const lastEl = collector[collector.length - 1];
      if (lastEl && lastEl.type === 2) {
        if (this.trimBlocks) {
          lastEl.text = lastEl.text.replace(/\r?\n *$/, '');
        } else if (this.lstripBlocks) {
          lastEl.text = lastEl.text.replace(/\s*$/, '');
        }
      }

      collector.push(element);
    }
    this.parse(this.advance(str, this.endIndex));
  }

  genNode(type, expr) {
    return {
      type,
      parent: this.parent,
      text: expr,
      _index: this.scanIndex,
      _len: this.endIndex,
      _ast: this,
    };
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

  collectChars(str) {
    const collector = this.genCollector();
    const lastEl = collector[collector.length - 1];
    let el;

    if (typeof str === 'string') {
      if (!str.length) {
        return;
      }

      el = this.genNode(2, str);
      this.processor.text(el);
    } else {
      el = str;
    }

    if (lastEl && lastEl.type === 2) {
      lastEl.text += el.text;
    } else {
      if (lastEl) {
        // trim start
        if (this.trimBlocks) {
          el.text = el.text.replace(/^ *\r?\n/, '');
        } else if (this.lstripBlocks) {
          el.text = el.text.replace(/^\s*/, '');
        }
      }

      collector.push(el);
    }
  }

  // close block
  // change current parent
  closeTag(tagName) {
    const p = this.parent;
    if (p) {
      this.parent = this.parent.parent;

      if (p.tag !== tagName) {
        if (!p.else && !p.elseif && !p.elif) {
          utils.warn(`${p.tag} was not closed`, p);
        }
        return this.closeTag(tagName);
      } else {
        return p;
      }
    }
  }
}

module.exports = function(html, options, fileUrl, musObj) {
  mus = musObj;
  const ast = new Ast(html, options, fileUrl);
  mus = null;
  return ast;
};
