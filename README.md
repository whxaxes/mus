# Mus

[![Build Status][travis-image]][travis-url]
[![Coverage Status][coveralls-image]][coveralls-url]

A server-side javascript template library like nunjucks, it's not complete yet.

## support

- [x] variable
- [x] for
- [x] if else
- [x] set
- [x] raw
- [x] macro
- [x] filter
- [x] extend
- [x] block
- [x] include

## how to use

```terminal
npm install node-mus
```

```javascript
const Mus = require('Mus');
const mus = new Mus();
mus.renderString('{{ mus }}', { mus: 'hello mus' }); // hello mus;
```

or you can see the test example

- [test](https://github.com/whxaxes/mus/blob/master/test/template/test.tpl)
- [test2](https://github.com/whxaxes/mus/blob/master/test/template/test2.tpl)

## test

```terminal
npm test
```

## coverage

```terminal
npm run cov
```

## License
MIT

[npm-url]: https://npmjs.org/package/mus
[npm-image]: http://img.shields.io/npm/v/mus.svg?style=flat-square
[travis-url]: https://travis-ci.org/whxaxes/mus
[travis-image]: http://img.shields.io/travis/whxaxes/mus.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/whxaxes/mus
[coveralls-image]: https://img.shields.io/coveralls/whxaxes/mus.svg?style=flat-square
