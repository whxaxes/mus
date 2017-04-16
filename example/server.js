'use strict';
const http = require('http');
const path = require('path');
const fs = require('fs');
const Mus = require('../lib');
const regexp = /^\/([^\/]+)\/([^\/]+)/;
const port = 8989;
const mus = new Mus({
  baseDir: __dirname,
  noCache: true,
});

http.createServer((req, res) => {
  const url = req.url;
  const matches = url.match(regexp);
  if (matches) {
    const fileUrl = path.join(__dirname, matches[1], 'index.js');
    if (fs.existsSync(fileUrl)) {
      const handle = require(fileUrl);
      req.requestUrl = matches[2];
      res.writeHead(200, {
        'Content-Type': 'text/html;charset=utf-8',
      });
      return handle(req, res);
    }
  } else if (url === '/') {
    const list = fs.readdirSync(__dirname);
    const dirList = list.filter(item => fs.lstatSync(path.join(__dirname, item)).isDirectory());
    res.writeHead(200, {
      'Content-Type': 'text/html;charset=utf-8',
    });
    return res.end(mus.render('menu', { dirList }));
  }

  res.writeHead(404);
  res.end('404');
}).listen(port);

console.log(`server listen ${port}`);
console.log(`visit http://127.0.0.1:${port}/`);
