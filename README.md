# Mus

[![NPM version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Appveyor status][appveyor-image]][appveyor-url]
[![Coverage Status][coveralls-image]][coveralls-url]

A server-side javascript template library, high performance and extending easily.

## Quick start

```terminal
npm install node-mus --save
```

Or 

```terminal
yarn add node-mus --save
```

Simple demo

```javascript
const mus = require('node-mus');
mus.renderString('{{ mus }}', { mus: 'hello mus' }); // hello mus;
```

## Apis

### configure(options)

#### options

- baseDir `String`, `default: __dirname`
- blockStart `String`, `default: {%`
- blockEnd  `String`, `default: %}`
- variableStart  `String`, `default: {{`
- variableEnd  `String`, `String`, `default: }}`
- noCache  `Boolean`, `default: false`
- ext `String`, `default: tpl`
- autoescape `Boolean`, `default: true`
- compress `Boolean`, `default: false`

e.g.

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

### render(path[, args])

render template file

```javascript
mus.render('test', { text: 'hello' });
// render test.tpl to string
```

### renderString(html[, args])

render template string

```javascript
mus.renderString('asd{{ text }}', { text: 'hello' });
// output: asdhello
```

### setFilter(name, cb)

create a custom filter.

```javascript
mus.setFilter('join', arr => arr.join(','));
```

using

```javascript
mus.renderString('{{ text | join }}', { text: [1, 2] });
// output: 12
```

### setTag(name, tagOptions)

create a custom tag.

#### tagOptions

- unary `Boolean`, `if true, endtag was no need`
- attrName `String`, `default attribute name, default is 'default'`
- render(attr, scope, compiler) `Function`, `render function`

#### render function args

- attr `Object`, `attribute in tag`
- scope `Object`, `render scope`
- compiler `Object`, `compiler object`

#### compiler property

- fileUrl `String`, `template file url`
- include(templateUrl, scope) `Function`, `include other template file, would return rendered string`
- compile(ast, scope) `Function`, `compile ast to string, would return rendered string.`

e.g.

```javascript
mus.setTag('css', {
  unary: true,
  attrName: 'href',
  render(attr, scope, compiler) {
    return `<link href="${attr.href}" rel="stylesheet">`;
  }
});
```

using

```javascript
mus.renderString('{% css "style.css" %}');
// output: <link href="style.css" rel="stylesheet">
```

compile child node, `this` in render function was current tag object.

```javascript
mus.setTag('style', {
  render(attr, scope, compiler) {
    return `<style>${compiler.compile(this.children, scope)}</style>`;
  }
});
```

using

```javascript
mus.renderString('{% style %}.text{margin: 10px;}{% endstyle %}')
// output: <style>.text{margin: 10px;}</style>
```

[custom tag example](https://github.com/whxaxes/mus/blob/master/example/custom/index.js)

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

using function

```javascript
mus.renderString('{{ add(1, 2) }}', {
  add: (a, b) => a+b,
}); // 3;
```

builtin function

- range(start[, end])
- regular(str[, flag]) `create a regular object`

### regular expression

It needs to be prefixed with `r`.

```javascript
mus.renderString('{{ test | replace(r/[a-z]/gi, 'b') }}', {
  test: 'aBc11cc'
}); // bbb11bb;
```

### smarty style

and or not

```javascript
mus.renderString('<div>{{ not test1 and test3 or test2 }}</div>', {
   test1: false,
   test2: '123'
}) // <div>123</div>;
```

if condition. but I extremely suggested using `a ? b : c` instead.

```javascript
mus.renderString('<div>{{ "123" if test1 else "321" }}</div>', {
 test1: false 
}); // <div>321</div>
```

### comment

```javascript
mus.renderString('11{# {{ test }} #}', {
  test: 'hello mus',
}); // 11;
```

### filter

```javascript
// expression would be autoescape
// use safe filter to prevent escape
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

builtin filter 

 - nl2br `replace '\n' or '\r\n' to <br/>`
 - json `JSON.stringify`
 - escape  `escape html tag`
 - reverse  `Array#reverse`
 - replace  `String#replace`
 - abs  `Math.abs`
 - join `Array#join`
 - lower `String#lower`
 - upper `String#upper`
 - slice `Array#slice`
 - trim `String#trim`
 - safe `use to prevent escape`

[source](https://github.com/whxaxes/mus/blob/master/lib/utils/filters.js)

## Tags

### for 

```smarty
{% for item in list %}
    ({{ loop.index0 }}:{{ item }})
{% endfor %}
```

```javascript
mus.render('test', {
    list: [1, 2],
}); // (0:1)(1:2)
```

### if 

```smarty
{% if test > 1 %}
    {{ test }}
{% endif %}
```

```javascript
mus.render('test', {
    test: 2
}); // 2
```

Or

```smarty
{% if test > 2 %}
    {{ test }}
{% elseif test === 2 %}
    111
{% else %}
    333
{% endif %}
```

```javascript
mus.render('test', {
    test: 2
}); // 111
```

### set

```smarty
{% set test = { say: 'hello' } %}

{{ test.say }}
```

```javascript
mus.render('test');
// hello
```

### raw

```smarty
{% raw %}
    {{ test }}
{% endraw %}
```

```javascript
mus.render('test', {
    test: 2
}); // {{ test }}
```

### filter

```smarty
{% filter replace(123, 321) %}
  {% for item in list %}
    {{ item }}
  {% endfor %}
{% endfilter %}
```

```javascript
mus.render('test', { list: [123, 12, 123] });
// output: 32112321
```

### macro

```smarty
{% macro test %}
    123
{% endmacro %}

{{ test() }}
```

```javascript
mus.render('test'); 
// 123
```

with arguments

```smarty
{% macro test(a, b = '123') %}
  {{ a }}{{ b }}
{% endmacro %}

{{ test('123') }}
```

```javascript
mus.render('test'); 
// 123123
```

### import

import other template's macro

```smarty
{% macro test(a, b = '123') %}
  {{ a }}{{ b }}
{% endmacro %}
```

```smarty
{% import "test" %}
{{ test(123) }}
```

Or

```smarty
{% import "test" as item %}
{{ item.test(123) }}
```

### extends & block

template 1: test.tpl

```smarty
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

```smarty
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

```smarty
{% include './test2.tpl' test=obj.text %}
```

template 2: test2.tpl

```smarty
hello {{ test }}
```

render:

```javascript
mus.render('test.tpl', { obj: { text: 'mus' } }); 
// hello mus
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


