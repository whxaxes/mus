'use strict';
const fs = require('fs');
const path = require('path');
const Ast = require('./ast');
const utils = require('./utils');
const render = require('./render');
const cache = {};
const baseOptions = {};

class Mus {
  constructor(options = {}) {
    this.filters = Object.assign({}, options.filters);
    this.cache = options.hasOwnProperty('cache') ? options.cache : true;
    this.baseDir = options.baseDir || __dirname;
    this.ext = options.ext || 'tpl';
    this.options = options;
  }

  render(url, args) {
    let templatePath = path.resolve(this.baseDir, url);
    if (!path.extname(templatePath)) {
      templatePath += `.${this.ext}`;
    }
    if (!fs.existsSync(templatePath)) {
      throw new Error(`${templatePath} not found!`);
    }
    const html = utils.cache(templatePath, () => {
      return fs.readFileSync(templatePath).toString();
    });
    const ast = this.getAst(html, templatePath);
    return render(ast, args, this.filters);
  }

  renderString(html, args) {
    const ast = this.getAst(html);
    return render(ast, args, this.filters);
  }

  getAst(html, key) {
    const options = Object.assign({}, baseOptions, this.options);
    return utils.cache(`ast_${key || html}`, () => new Ast(html, options))
  }

  setFilter(name, cb) {
    this.filters[name] = cb;
  }
}

module.exports = Mus;
