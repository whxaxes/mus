'use strict';

const Benchmark = require('benchmark');
const suite = new Benchmark.Suite();
const nunjucks = require('nunjucks');
const Mus = require('../lib');
const assert = require('power-assert');
const mus = new Mus({
  baseDir: 'test/template',
});
nunjucks.configure('test/template', { autoescape: true });

const obj = {
  test: '123',
  html: '<div>123\n321</div>',
  list: [
    {
      url: 'http://baidu.com',
      name: 'test',
      show: false,
      subjects: [
        {
          subName: 'subjects1'
        },
        {
          subName: 'subjects2'
        },
      ]
    },
    {
      name: 'test2',
      show: true,
    }
  ]
};

assert(mus.render('test6.tpl', obj).length === nunjucks.render('test6.tpl', obj).length);

suite
  .add('Mus#renderNested', function() {
    mus.render('test6.tpl', obj);
  })
  .add('Nunjucks#renderNested', function() {
    nunjucks.render('test6.tpl', obj);
  })
  // add listeners
  .on('cycle', function(event) {
    console.log(String(event.target));
  })
  .on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  .run();
