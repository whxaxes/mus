'use strict';
const Mus = require('../../lib').Mus;
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
mus.setTag('html', {
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
mus.setTag('head', {
  render(attr, scope, compiler) {
    header = compiler.compile(this.children, scope);
  },
});

// collect body data
mus.setTag('body', {
  render(attr, scope, compiler) {
    body = compiler.compile(this.children, scope);
  },
});

// collect stylesheet
mus.setTag('style', {
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
mus.setTag('css', {
  unary: true,
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
mus.setTag('script', {
  render(attr, scope, compiler) {
    scriptList.push(compiler.compile(this.children, scope));
  },
});

// same name require
mus.setTag('require', {
  unary: true,
  attrName: 'url',
  render(attr, scope, compiler) {
    const dirName = path.dirname(compiler.fileUrl);
    const ext = path.extname(attr.url);
    let tplUrl;
    let cssUrl;
    let scriptUrl;

    if (ext === '.js') {
      scriptUrl = path.resolve(dirName, attr.url);
    } else if (ext === '.css') {
      cssUrl = path.resolve(dirName, attr.url);
    } else {
      const nameArr = attr.url.split(path.sep);
      const fileName = nameArr[nameArr.length - 1];
      tplUrl = path.resolve(dirName, nameArr.concat(fileName).join(path.sep));
      cssUrl = path.resolve(dirName, nameArr.concat([fileName + '.css']).join(path.sep));
      scriptUrl = path.resolve(dirName, nameArr.concat([fileName + '.js']).join(path.sep));
    }

    // save same name stylesheet
    if (cssUrl && fs.existsSync(cssUrl)) {
      styleList.push(fs.readFileSync(cssUrl, { encoding: 'utf-8' }));
    }

    if (scriptUrl && fs.existsSync(scriptUrl)) {
      scriptList.push(fs.readFileSync(scriptUrl, { encoding: 'utf-8' }));
    }

    if (tplUrl) {
      return compiler.include(tplUrl, scope);
    }
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
