'use strict';
const Mus = require('../../lib');
const fs = require('fs');
const path = require('path');
const mus = new Mus({
  baseDir: __dirname,
  noCache: true,
});
let header = '';
let body = '';
const styleList = [];
const scriptList = [];

// compose html
mus.registerTag('html', {
  render(attr, scope, compiler) {
    compiler.compile(this.children, scope);
    return `<html lang="${attr.lang}">
      <head>
        ${header}
        <style>
          ${styleList.join('')}
        </style>
      </head>
      <body>
        ${body}
        <script>
          ${scriptList.join('')}
        </script>
      </body>
    </html>`;
  },
});

// collect head data
mus.registerTag('head', {
  render(attr, scope, compiler) {
    header = compiler.compile(this.children, scope);
  },
});

// collect body data
mus.registerTag('body', {
  render(attr, scope, compiler) {
    body = compiler.compile(this.children, scope);
  },
});

// collect stylesheet
mus.registerTag('style', {
  render(attr, scope, compiler) {
    const atf = attr.hasOwnProperty('atf') ? attr.atf : true;
    const styleContent = compiler.compile(this.children, scope);
    if (atf) {
      styleList.push(styleContent);
    } else {
      return `<style>${styleContent}</style>`;
    }
  },
});

// inline stylesheet
mus.registerTag('css', {
  isUnary: true,
  attrName: 'href',
  render(attr, scope, compiler) {
    const cssUrl = path.resolve(
      path.dirname(compiler.fileUrl),
      attr.href
    );
    styleList.push(fs.readFileSync(cssUrl, { encoding: 'utf-8' }));
  },
});

// collect script
mus.registerTag('script', {
  render(attr, scope, compiler) {
    scriptList.push(compiler.compile(this.children, scope));
  },
});

// same name require
mus.registerTag('require', {
  isUnary: true,
  attrName: 'url',
  render(attr, scope, compiler) {
    const nameArr = attr.url.split(path.sep);
    const fileName = nameArr[nameArr.length - 1];
    const dirName = path.dirname(compiler.fileUrl);
    const tplUrl = path.resolve(
      dirName, nameArr.concat(fileName).join(path.sep)
    );
    const cssUrl = path.resolve(
      dirName, nameArr.concat([fileName + '.css']).join(path.sep)
    );
    // save same name stylesheet
    if (fs.existsSync(cssUrl)) {
      styleList.push(fs.readFileSync(cssUrl, { encoding: 'utf-8' }));
    }
    return compiler.include(tplUrl, scope);
  },
});

module.exports = (req, res) => {
  header = '';
  body = '';
  styleList.length = 0;
  scriptList.length = 0;

  res.end(mus.render(req.requestUrl, {
    title: 'Hello Custom',
    dataList: [
      {
        name: 'Bob',
        age: '18',
      },
      {
        name: 'Charles',
        age: '20',
      },
      {
        name: 'Tom',
        age: '10',
      },
      {
        name: 'Berg',
        age: '36',
      },
      {
        name: 'Bob',
        age: '18',
      },
      {
        name: 'Charles',
        age: '20',
      },
      {
        name: 'Tom',
        age: '10',
      },
      {
        name: 'Berg',
        age: '36',
      },
    ],
  }));
};
