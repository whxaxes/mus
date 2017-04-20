# Mus

[![NPM version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Appveyor status][appveyor-image]][appveyor-url]
[![Coverage Status][coveralls-image]][coveralls-url]

A server-side javascript template library, high performance and extending easily.

## Benchmark

```terminal
Mus#renderExtend x 40,578 ops/sec ±2.35% (84 runs sampled)
Nunjucks#renderExtend x 14,102 ops/sec ±2.45% (80 runs sampled)
Swig#renderExtend x 20,764 ops/sec ±2.86% (88 runs sampled)
Fastest is Mus#renderExtend
Mus#renderNested x 53,453 ops/sec ±1.69% (85 runs sampled)
Nunjucks#renderNested x 32,862 ops/sec ±1.75% (86 runs sampled)
Swig#renderNested x 27,586 ops/sec ±1.76% (86 runs sampled)
Fastest is Mus#renderNested
Mus#renderSimple x 708,375 ops/sec ±1.16% (87 runs sampled)
Nunjucks#renderSimple x 343,384 ops/sec ±1.79% (85 runs sampled)
Swig#renderSimple x 97,091 ops/sec ±1.76% (85 runs sampled)
Fastest is Mus#renderSimple
```

## Quick start

```terminal
npm install node-mus
```

```javascript
const mus = require('node-mus');
mus.renderString('{{ mus }}', { mus: 'hello mus' }); // hello mus;
```

## Options

- baseDir `default: __dirname`
- blockStart `default: {%`
- blockEnd  `default: %}`
- variableStart  `default: {{`
- variableEnd  `default: }}`
- noCache  `default: false`
- ext `default: tpl`

example:

```javascript
const mus = require('node-mus');
mus.configure({
   baseDir: 'template',
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
// render template/test.ejs to '<div>123</div>'
```

## Apis

### configure(options)

configure mus

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

create a custom filter

```javascript
mus.setFilter('join', arr => arr.join(','));
```

### setTag(name, tagOptions)

create a custom tag.

```javascript
mus.setTag('css', {
  unary: true,
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
mus.renderString('{{ !test ? text : "nothing" }}', {
  test: false,
  text: 'hello mus',
}); // hello mus;
```

### smarty style

and or not

```javascript
mus.renderString('<div>{{ not test1 and test3 or test2 }}</div>', {
   test1: false,
   test2: '123'
}) // <div>123</div>;
```

if condition, but I extremely suggested using `a ? b : c` instead.

```javascript
mus.renderString('<div>{{ "123" if test1 else "321" }}</div>', {
 test1: false 
}); // <div>321</div>
```

### filter

```javascript
mus.renderString('{{ text | nl2br | safe }}', {
  text: 'hello \n mus',
}); // hello <br/> mus;
```

custom filter

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

create an unary tag

```javascript
mus.setTag('css', {
  unary: true,
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

create a multinary tag (need endtag).

```javascript
mus.setTag('style', {
  unary: false,
  render(attr, scope, compiler) {
    return `<style>${compiler.compile(this.children, scope)}</style>`
  }
});

mus.renderString('{% style %}.text{margin: 10px;}{% endstyle %}')
// output: <style>.text{margin: 10px;}</style>
```

include other template in custom tag

```javascript
mus.setTag('require', {
   unary: true,
   render(attr, scope, compiler) {
     return compiler.include(attr.url, scope);
   }
});

mus.renderString('{% require url="test2.tpl" %}');
```

[see the example to know more](https://github.com/whxaxes/mus/tree/master/example/custom)

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

## Command

test

```terminal
npm test
```

benchmark

```terminal
npm run benchmark
```

example

```terminal
npm run example
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


