'use strict';
const fs = require('fs');
const path = require('path');
const ast = require('./compile/ast');
const utils = require('./utils/utils');
const compile = require('./compile/compile');
const globalFilters = require('./utils/filters');
const processor = require('./compile/processor');

class Mus {
  constructor(options) {
    this.customTags = new Map();
    this.filters = Object.assign({}, globalFilters);
    this.configure(options);
  }

  get Mus() {
    return Mus;
  }

  configure(options = {}) {
    const noCache = options.hasOwnProperty('noCache') ? options.noCache : false;
    this.filters = Object.assign(this.filters, options.filters);
    this.cacheStore = noCache ? null : new Map();
    this.baseDir = options.baseDir || __dirname;
    this.ext = options.ext || 'tpl';
    this.options = options;
  }

  render(url, args) {
    return compile(this.getAstByUrl(url), args, this);
  }

  renderString(html, args) {
    return compile(this.getAst(html), args, this);
  }

  getAstByUrl(url) {
    const temObj = this.getTemplate(url);
    return this.getAst(temObj.text, temObj.url);
  }

  getTemplate(filePath) {
    if (!path.extname(filePath)) {
      filePath += `.${this.ext}`;
    }

    return this.cacheStore
      ? utils.cache(filePath, () => this.readFile(filePath), this.cacheStore)
      : this.readFile(filePath);
  }

  readFile(filePath) {
    const templatePath = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(this.baseDir, filePath);

    if (!fs.existsSync(templatePath)) {
      throw new Error(`${templatePath} not found!`);
    }

    const fileObj = {
      url: templatePath,
      text: fs.readFileSync(templatePath).toString(),
    };

    // absolute path cache
    if (templatePath !== filePath && this.cacheStore) {
      return utils.cache(templatePath, fileObj, this.cacheStore);
    } else {
      return fileObj;
    }
  }

  getAst(html, fileUrl) {
    if (this.cacheStore) {
      return utils.cache(`ast_${fileUrl || html}`, () => {
        return ast(html, this.options, fileUrl, this);
      }, this.cacheStore);
    } else {
      return ast(html, this.options, fileUrl, this);
    }
  }

  setFilter(name, cb) {
    this.filters[name] = cb;
  }

  setTag(name, tagOptions) {
    if (!tagOptions || !tagOptions.render) {
      throw new Error('render function must exist!');
    }

    if (processor.hasOwnProperty(name)) {
      throw new Error(`can't register build-in tag(${name})`);
    }

    this.customTags.set(name, tagOptions);
  }
}

module.exports = new Mus();
