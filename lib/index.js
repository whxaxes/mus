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
    const ast = this.getAst(this.getTemplate(url), url);
    return compile(ast, args, this);
  }

  renderString(html, args) {
    const ast = this.getAst(html);
    return compile(ast, args, this);
  }

  getAstByUrl(url) {
    return this.getAst(this.getTemplate(url), url);
  }

  getTemplate(relativePath) {
    let templatePath = path.resolve(this.baseDir, relativePath);
    if (!path.extname(templatePath)) {
      templatePath += `.${this.ext}`;
    }
    if (!fs.existsSync(templatePath)) {
      throw new Error(`${templatePath} not found!`);
    }
    return utils.cache(templatePath, () => {
      return fs.readFileSync(templatePath).toString();
    });
  }

  getAst(html, key) {
    const options = Object.assign({}, this.options);
    if (!this.noCache) {
      return utils.cache(`ast_${key || html}`, () => new Ast(html, options));
    } else {
      return new Ast(html, options);
    }
  }

  setFilter(name, cb) {
    this.filters[name] = cb;
  }
}

module.exports = Mus;
