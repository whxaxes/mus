# Mus

[![NPM version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Appveyor status][appveyor-image]][appveyor-url]
[![Coverage Status][coveralls-image]][coveralls-url]

A server-side javascript template library like nunjucks.

## Quick start

```terminal
npm install node-mus
```

```javascript
const Mus = require('node-mus');
const mus = new Mus();
mus.renderString('{{ mus }}', { mus: 'hello mus' }); // hello mus;
```

or you can see the test example

- [test](https://github.com/whxaxes/mus/blob/master/test/template/test.tpl)
- [test2](https://github.com/whxaxes/mus/blob/master/test/template/test2.tpl)

## Feature list

* base
  - [x] variable
  - [x] comment
  - [x] filter

* tags
  - [x] for
  - [x] if else
  - [x] set
  - [x] raw
  - [x] macro
  - [x] extends
  - [x] block
  - [x] include

* other
  - [x] custom tag
  - [x] friendly error
  - [ ] browser support

## Test

```terminal
npm test
```

## Benchmark

```terminal
npm run benchmark
```

benchmark result, compare with Nunjucks

```terminal
Mus#renderString x 50,851 ops/sec ±0.95% (88 runs sampled)
Nunjucks#renderString x 869 ops/sec ±2.35% (87 runs sampled)
Fastest is Mus#renderString
Mus#renderExtend x 40,506 ops/sec ±1.04% (92 runs sampled)
Nunjucks#renderExtend x 14,856 ops/sec ±5.70% (78 runs sampled)
Fastest is Mus#renderExtend
Mus#renderNested x 47,574 ops/sec ±1.42% (91 runs sampled)
Nunjucks#renderNested x 42,775 ops/sec ±0.96% (91 runs sampled)
Fastest is Mus#renderNested
Mus#renderSimple x 595,043 ops/sec ±1.24% (90 runs sampled)
Nunjucks#renderSimple x 292,816 ops/sec ±1.63% (81 runs sampled)
Fastest is Mus#renderSimple
```

## Options

- blockStart `default: {%`
- blockEnd  `default: %}`
- variableStart  `default: {{`
- variableEnd  `default: }}`
- noCache  `default: false`
- ext `default: tpl`

for example:

```javascript
const mus = new Mus({
   blockStart: '<%',
   blockEnd: '%>',
   variableStart: '<%=',
   variableEnd: '%>',
   ext: 'ejs',
});
const template = '<% if test %><div><%= test %></div><% endif %>';
mus.renderString(template, { test: '123' });
// '<div>123</div>'

mus.render('test', { test: '123' });
// render test.ejs to '<div>123</div>'
```

## Apis

### render(path[, args])

render template file to html

```javascript
mus.render('test', { text: 'hello' });
```

### renderString(html[, args])

render template string to html

```javascript
mus.renderString('asd{{ text }}', { text: 'hello' });
```

### setFilter(name, cb)

create self-defined filter

```javascript
mus.setFilter('join', arr => arr.join(','));
```

### registerTag(name, tagOption)

register a custom tag

```javascript
mus.registerTag('css', {
  isUnary: true,
  attrName: 'href',
  render(attr) {
    return `<link href="${attr.href}" rel="stylesheet">`;
  }
});
```

## Base Feature

### variable

```javascript
mus.renderString('{{ obj.hello }}{{ obj.mus }}', {
  obj: {
    hello: 'hello',
    mus: 'mus'  
  }
}); // hello mus;
```

### expression

```javascript
mus.renderString('{{ test > 0 ? text : "nothing" }}', {
  test: 1,
  text: 'hello mus',
}); // hello mus;
```

### filter

```javascript
mus.renderString('{{ text | nl2br | safe }}', {
  text: 'hello \n mus',
}); // hello <br/> mus;
```

or use self-define filter

```javascript
mus.setFilter('add', (input, a) => {
  return +input + a;
});

mus.renderString('{{ text | add(2) }}', {
  text: 1,
}); // 3;
```

build-in filter 

 - nl2br
 - json
 - escape
 - reverse
 - replace
 - abs
 - join
 - lower
 - upper
 - slice
 - trim

https://github.com/whxaxes/mus/blob/master/lib/utils/filters.js

### comment

```javascript
mus.renderString('11{# {{ test }} #}', {
  test: 'hello mus',
}); // 11;
```

## Tags

### for 

```javascript
mus.renderString('{% for item in list %}({{ loop.index0 }}:{{ item }}){% endfor %}', {
    list: [1, 2],
}); // (0:1)(1:2)
```

### if 

```javascript
mus.renderString('{% if test > 1 %}{{ test }}{% endif %}', {
    test: 2
}); // 2
```

```javascript
const tpl = '{% if test > 2 %}{{ test }}{% elseif test === 2 %}111{% else %}333{% endif %}';
mus.renderString(tpl, {
    test: 2
}); // 111
```

### set

```javascript
mus.renderString('{% set test = test2 %}{{ test }}', {
    test2: 2,
}); // 2
```

### raw

```javascript
mus.renderString('{% raw %}{{ test }}{% endraw %}', {
    test: 2
}); // {{ test }}
```

### macro

```javascript
mus.renderString('{% macro test %}123{% endmacro %}{{ test() }}'); // 123
```

### extends & block

template 1: test.tpl

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{{ title }}</title>
</head>
<body>
  {% block main %}
    test.tpl content
  {% endblock %}
</body>
</html>
```

template 2: test2.tpl

```html
{% extends './test.tpl' %}

{% block main %}
  test2.tpl content
{% endblock %}
```

render

```javascript
mus.render('test2.tpl'); 
// <!doctype html> ... test2.tpl content ...
```

### include 

template 1: test.tpl

```html
{% include './test2.tpl' test=obj.text %}
```

template 2: test2.tpl

```html
hello {{ test }}
```

render:

```javascript
mus.render('test.tpl', { obj: { text: 'mus' } }); 
// hello mus
```

## Custom Tag

register an unary tag

```javascript
mus.registerTag('css', {
  isUnary: true,
  attrName: 'href',
  render(attr) {
    return `<link href="${attr.href}" rel="stylesheet">`;
  }
});

mus.renderString('{% css "stylesheet.css" %}')
mus.renderString('{% css href="stylesheet.css" %}')
mus.renderString('{% css href=url %}', { url: 'stylesheet.css' })
// output: <link href="stylesheet.css" rel="stylesheet">
```

register a multinary tag (need endtag).

```javascript
mus.registerTag('style', {
  isUnary: false,
  render(attr, scope, compiler) {
    return `<style>${compiler.compile(this.children, scope)}</style>`
  }
});

mus.renderString('{% style %}.text{margin: 10px;}{% endstyle %}')
// output: <style>.text{margin: 10px;}</style>
```

include other template in custom tag

```javascript
mus.registerTag('require', {
   isUnary: true,
   render(attr, scope, compiler) {
     return compiler.include(attr.url, scope);
   }
});

mus.renderString('{% require url="test2.tpl" %}');
```

## Debug

### friendly error

```terminal
/Users/wanghx/Workspace/my-project/mus/test/template/test7.tpl:14:3

     12      {% endraw %}
     13    
     14      {{ num.replace('aaaa') }}
             ^^^^^^^^^^^^^^^^^^^^^^^^^
     15    </div>

Error: num.replace is not a function
    at Object.genError (/Users/wanghx/Workspace/my-project/mus/lib/utils/utils.js:107:19)
    at Object.throw (/Users/wanghx/Workspace/my-project/mus/lib/utils/utils.js:122:16)
```

## Author

wanghx

## License
MIT

[npm-url]: https://npmjs.org/package/node-mus
[npm-image]: http://img.shields.io/npm/v/node-mus.svg
[travis-url]: https://travis-ci.org/whxaxes/mus
[travis-image]: http://img.shields.io/travis/whxaxes/mus.svg
[appveyor-url]: https://ci.appveyor.com/project/whxaxes/mus/branch/master
[appveyor-image]: https://ci.appveyor.com/api/projects/status/github/whxaxes/mus?branch=master&svg=true
[coveralls-url]: https://coveralls.io/r/whxaxes/mus
[coveralls-image]: https://img.shields.io/coveralls/whxaxes/mus.svg


