'use strict';
const fs = require('fs');
const path = require('path');
const Ast = require('./compile/ast');
const utils = require('./utils/utils');
const compile = require('./compile/compile');

class Mus {
  constructor(options = {}) {
    this.filters = Object.assign({}, options.filters);
    this.noCache = options.hasOwnProperty('noCache') ? options.noCache : false;
    this.baseDir = options.baseDir || __dirname;
    this.ext = options.ext || 'tpl';
    this.options = options;
  }

  render(url, args) {
    return compile(this.getAstByUrl(url), args, this);
  }

  renderString(html, args) {
    const ast = this.getAst(html);
    return compile(ast, args, this);
  }

  getAstByUrl(url) {
    const temObj = this.getTemplate(url);
    return this.getAst(temObj.text, temObj.url);
  }

  getTemplate(relativePath) {
    if (!path.extname(relativePath)) {
      relativePath += `.${this.ext}`;
    }

    return utils.cache(relativePath, () => {
      let templatePath = path.resolve(this.baseDir, relativePath);

      if (!fs.existsSync(templatePath)) {
        throw new Error(`${templatePath} not found!`);
      }

      return {
        url: templatePath,
        text: fs.readFileSync(templatePath).toString(),
      };
    });
  }

  getAst(html, fileUrl) {
    if (!this.noCache) {
      return utils.cache(`ast_${fileUrl || html}`, () => {
        return new Ast(html, Object.assign({
          fileUrl,
        }, this.options));
      });
    } else {
      return new Ast(html, Object.assign({
        fileUrl,
      }, this.options));
    }
  }

  setFilter(name, cb) {
    this.filters[name] = cb;
  }
}

module.exports = Mus;
