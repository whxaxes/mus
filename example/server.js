'use strict';
const http = require('http');
const path = require('path');
const fs = require('fs');
const regexp = /^\/([^\/]+)\/([^\/]+)/;
const port = 8989;

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
  }

  res.writeHead(404);
  res.end('404');
}).listen(port);

console.log(`server listen ${port}`);
