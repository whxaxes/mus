# Mus

[![NPM version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Coverage Status][coveralls-image]][coveralls-url]

A server-side javascript template library like nunjucks.

## quick start

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

## support

- [x] variable
- [x] comment
- [x] for
- [x] if else
- [x] set
- [x] raw
- [x] macro
- [x] filter
- [x] extends
- [x] block
- [x] include

## options

- blockStart `default: {%`
- blockEnd  `default: %}`
- variableStart  `default: {{`
- variableEnd  `default: }}`
- noCache  `default: false` 

```javascript
const mus = new Mus({
   blockStart: '<%',
   blockEnd: '%>',
   variableStart: '<%=',
   variableEnd: '%>'
});
const template = '<% if test %><div><%= test %></div><% endif %>';
mus.renderString(template, { test: '123' });
// '<div>123</div>'
```

## apis

### render(path[, args])

render template file to html

### renderString(html[, args])

render template string to html

### setFilter(name, cb)

create self-defined filter

## feature

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

### comment

```javascript
mus.renderString('11{# {{ test }} #}', {
  test: 'hello mus',
}); // 11;
```

## tags

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
{% include './test2.tpl' %}
```

template 2: test2.tpl

```html
hello mus
```

render:

```javascript
mus.render('test.tpl'); 
// hello mus
```

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

[npm-url]: https://npmjs.org/package/node-mus
[npm-image]: http://img.shields.io/npm/v/node-mus.svg?style=flat-square
[travis-url]: https://travis-ci.org/whxaxes/mus
[travis-image]: http://img.shields.io/travis/whxaxes/mus.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/whxaxes/mus
[coveralls-image]: https://img.shields.io/coveralls/whxaxes/mus.svg?style=flat-square


