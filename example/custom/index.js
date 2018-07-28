'use strict';
const Mus = require('../../lib').Mus;
const fs = require('fs');
const path = require('path');
const mus = new Mus({
  baseDir: __dirname,
  noCache: true,
});

// compose html
mus.setTag('html', {
  render(attr, data, compiler) {
    // init scope
    compiler.store.header = '';
    compiler.store.body = '';
    compiler.store.styleList = [];
    compiler.store.scriptList = [];

    // compile children node
    compiler.compile(this.children, data);

    // render full html
    return `<html lang="${attr.lang}">
      <head>
        ${compiler.store.header}
        <style>
          ${compiler.store.styleList.join('')}
        </style>
      </head>
      <body>
        ${compiler.store.body}
        <script>
          ${compiler.store.scriptList.join('')}
        </script>
      </body>
    </html>`;
  },
});

// collect head data
mus.setTag('head', {
  render(attr, data, compiler) {
    compiler.store.header = compiler.compile(this.children, data);
  },
});

// collect body data
mus.setTag('body', {
  render(attr, data, compiler) {
    compiler.store.body = compiler.compile(this.children, data);
  },
});

// collect stylesheet
mus.setTag('style', {
  render(attr, data, compiler) {
    const atf = attr.hasOwnProperty('atf') ? attr.atf : true;
    const styleContent = compiler.compile(this.children, data);
    if (atf) {
      compiler.store.styleList.push(styleContent);
    } else {
      return `<style>${styleContent}</style>`;
    }
  },
});

// inline stylesheet
mus.setTag('css', {
  unary: true,
  attrName: 'href',
  render(attr, data, compiler) {
    const cssUrl = path.resolve(
      path.dirname(compiler.fileUrl),
      attr.href
    );
    compiler.store.styleList.push(fs.readFileSync(cssUrl, { encoding: 'utf-8' }));
  },
});

// collect script
mus.setTag('script', {
  render(attr, data, compiler) {
    compiler.store.scriptList.push(compiler.compile(this.children, data));
  },
});

// same name require
mus.setTag('require', {
  unary: true,
  attrName: 'url',
  render(attr, data, compiler) {
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
      compiler.store.styleList.push(fs.readFileSync(cssUrl, { encoding: 'utf-8' }));
    }

    if (scriptUrl && fs.existsSync(scriptUrl)) {
      compiler.store.scriptList.push(fs.readFileSync(scriptUrl, { encoding: 'utf-8' }));
    }

    if (tplUrl) {
      return compiler.include(tplUrl, data);
    }
  },
});

module.exports = (req, res) => {
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
