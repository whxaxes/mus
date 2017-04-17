'use strict';
const Mus = require('../../lib').Mus;
const mus = new Mus({
  baseDir: __dirname,
  noCache: true,
});

module.exports = (req, res) => {
  res.end(mus.render(req.requestUrl, {
    title: 'Hello Mus',
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
