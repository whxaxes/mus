'use strict';

const Benchmark = require('benchmark');
const suite = new Benchmark.Suite();
const re = /'|"|`/;

suite
  .add('test1', function() {
    const str = ['\'', '"', '`'][Math.floor(Math.random() * 3)];
    const result = re.test(str);
  })
  .add('test2', function() {
    const str = ['\'', '"', '`'][Math.floor(Math.random() * 3)];
    const result = str === '\'' || str === '"' || str === '`';
  })
  // add listeners
  .on('cycle', function(event) {
    console.log(String(event.target));
  })
  .on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  .run();
