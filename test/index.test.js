'use strict';

const Mus = require('../lib');
const assert = require('power-assert');
const mus = new Mus({
  baseDir: 'test/template',
  ext: 'tpl',
  noCache: true,
});

describe('lib#index', () => {
  describe('test base feature', () => {
    it('should support variable', () => {
      assert(mus.renderString('<div>{{ test }}</div>', { test: '123' }) === '<div>123</div>');
    });

    it('should run without error under interference', () => {
      assert(mus.renderString('{{ {% asd {{ test }}', { test: '123' }) === '{{ {% asd 123');
    });

    it('should support commentBlock', () => {
      assert(mus.renderString('123{# {{ test }} #}', { test: '123' }) === '123');
    });

    it('should support not-closed comment', () => {
      assert(mus.renderString('123{# {{ test }} asdasd s', { test: '123' }) === '123');
    });

    it('should support expression', () => {
      assert(mus.renderString('<div>{{ test === "123" ? "321" : "123" }}</div>', { test: '123' }) === '<div>321</div>');
    });

    it('should throw error if expression has grammatical errors', (done) => {
      try {
        mus.renderString('{{ abc abc }}', { abc: 1 })
      } catch (e) {
        done();
      }
      throw new Error('not throw error');
    });

    it('should support self-defined blockStart and variableStart', () => {
      const mus = new Mus({
        blockStart: '<%',
        blockEnd: '%>',
        variableStart: '<%=',
        variableEnd: '%>',
        noCache: true,
      });

      assert(mus.renderString('<% if test %><div><%= test %></div><% endif %>', { test: '123' }) === '<div>123</div>');
    });

    it('should throw the error if the blockStart are the same as variableStart', (done) => {
      try {
        const mus = new Mus({
          blockStart: '<%',
          blockEnd: '%>',
          variableStart: '<%',
          variableEnd: '%>',
          noCache: true,
        });
        mus.renderString('<% if test %><div><%= test %></div><% endif %>');  
      } catch (e) {
        return done();
      }

      throw new Error('not throw error');
    });
  });

  // if block test
  describe('test if', () => {
    it('should support ifBlock,elseIfBlock and elseBlock', () => {
      const html = '{% if test %}<div>{{ test }}</div>{% elseif gg === "123" %}{{ gg }}{% else %}321{% endif %}';
      assert(mus.renderString(html, { test: '123' }) === '<div>123</div>');
      assert(mus.renderString(html, { gg: '123' }) === '123');
      assert(mus.renderString(html) === '321');
    });

    it('should throw error if ifBlock has no condition', (done) => {
      try {
        mus.renderString('{% if %}<div>{{ test }}</div>{% endif %}')
      } catch (e) {
        done();
      }
      throw new Error('not throw error');
    });

    it('should throw error if elseifBlock has no condition', (done) => {
      try {
        mus.renderString('{% if test %}<div>{{ test }}</div>{% elseif %}{{ gg }}{% else %}321{% endif %}')
      } catch (e) {
        done();
      }
      throw new Error('not throw error');
    });

    it('should throw error if elseBlock behind elseifBlock', (done) => {
      try {
        mus.renderString('{% if test %}<div>{{ test }}</div>{% else %}321{% elseif gg %}{{ gg }}{% endif %}')
      } catch (e) {
        done();
      }
      throw new Error('not throw error');
    });

    it('should throw error if has no ifBlock', (done) => {
      try {
        mus.renderString('{% elseif gg %}{{ gg }}{% else %}321{% endif %}')
      } catch (e) {
        done();
      }
      throw new Error('not throw error');
    });
  });

  // for block test
  describe('test for', () => {
    it('should support for', () => {
      const html = '{% for item in list %}<div>{{ item }}</div>{% endfor %}';
      assert(mus.renderString(html, { list: ['123', '321'] }) === '<div>123</div><div>321</div>');
    });

    it('should support get index in for', () => {
      const html = '{% for item, index in list %}<div>{{ index }}</div>{% endfor %}';
      assert(mus.renderString(html, { list: ['123', '321'] }) === '<div>0</div><div>1</div>');
    });

    it('should support object circle', () => {
      const html = '{% for item, key in obj %}{{ key }}:{{ item }}{% endfor %}';
      assert(mus.renderString(html, { obj: { a: '1', b: '2' } }) === 'a:1b:2');
    });

    it('should support loop.index in the circle', () => {
      const html = '{% for item in obj %}{{ loop.index }}:{{ loop.index0 }}:{{ loop.length }}:{{item}}{% endfor %}';
      assert(mus.renderString(html, { obj: { a: '1', b: '2' } }) === '1:0:2:12:1:2:2');
    });

    it('should support circle nested', () => {
      const html = '{% for item, key in obj %}{{ loop.index }}-{% for sub in (item.list || item.list2) %}{{ key }}:{{ sub }}{% endfor %}{% endfor %}';
      assert(mus.renderString(html, {
          obj: {
            list: { list: [1, 2] },
            list2: { list2: [1, 2] }
          }
        }) === '1-list:1list:22-list2:1list2:2');
    });

    it('should throw error if has no iterator', (done) => {
      try {
        mus.renderString('{% for %}<div>{{ test }}</div>{% endfor %}')
      } catch (e) {
        done();
      }
      throw new Error('not throw error');
    });
  });

  // set
  describe('test set', () => {
    it('should support set', () => {
      const html = '{% for item in list %}{% set sub = 123123 %}{{ sub }}{% endfor %}{{ sub }}';
      assert(mus.renderString(html, { list: [1] }) === '123123');
    });

    it('should throw error if has no key-value', (done) => {
      try {
        mus.renderString('{% set %}')
      } catch (e) {
        done();
      }
      throw new Error('not throw error');
    });
  });

  describe('test raw', () => {
    it('should support raw', () => {
      const html = '{% raw %}{{ test }}{% endraw %}';
      assert(mus.renderString(html) === '{{ test }}');
    });
  });

  describe('test macro', () => {
    it('should support macro', () => {
      assert(mus.renderString('{% macro test(a) %}{{ a }}{% endmacro %}{{ test("123") }}') === '123');
      assert(mus.renderString('{% macro test() %}123{% endmacro %}{{ test() }}') === '123');
    });

    it('should support macro use parent\'s scope', () => {
      const str = '{% macro test(a) %}({{ a }}{{ item }}){% endmacro %}{% for item in list %}{{ test("123") }}{{ test("321") }}{% endfor %}';
      assert(mus.renderString(str, { list: [1, 2] }) === '(1231)(3211)(1232)(3212)');
    });

    it('should throw error if has no name', (done) => {
      try {
        mus.renderString('{% macro %}asd{% endmacro %}')
      } catch (e) {
        done();
      }
      throw new Error('not throw error');
    });
  });

  describe('extends&block', () => {
    it('should support extends and block', () => {
      const html = mus.render('test3', { title: 'special title' });
      assert(html.indexOf('special title') >= 0);
      assert(html.indexOf('test3.tpl content') >= 0);
      assert(html.indexOf('test.tpl content') < 0);
    });

    it('should throw error if extendsBlock has no url', (done) => {
      try {
        mus.renderString('{% extends %}')
      } catch (e) {
        done();
      }
      throw new Error('not throw error');
    });

    it('should throw error if block has no name', (done) => {
      try {
        mus.renderString('{% block %}{% endblock %}')
      } catch (e) {
        done();
      }
      throw new Error('not throw error');
    });
  });

  describe('include', () => {
    it('should support include', () => {
      const html = mus.render('test3.tpl', { title: 'special title', test: '112233' });
      assert(html.indexOf('112233') >= 0);
      assert(html.indexOf('112233333333') >= 0);
    });
  });

  describe('filter', () => {
    it('should support filter ', () => {
      assert(mus.renderString('{{ test | safe | nl2br}}', { test: 'a\nb<div>' }) === 'a<br/>b<div>');
      assert(mus.renderString('{{ test | escape | nl2br | safe }}', { test: 'a\nb<div>' }) === 'a<br/>b&lt;div&gt;');
      assert(mus.renderString('{{ test | json | safe }}', { test: { a: '1' } }) === JSON.stringify({ a: '1' }));
      assert(mus.renderString('{{ test | nl2br | safe }}', { test: 'a\nb' }) === 'a<br/>b');
      assert(mus.renderString('{{ test | nl2br | json }}', { test: null }) === '{}');
    });

    it('should support filter in block', () => {
      mus.setFilter('isNull', val => val === null);
      assert(mus.renderString('{% for item in [1, 2] | reverse %}{{ item }}{% endfor %}') === '21');
      assert(mus.renderString('{% set myItem = test | nl2br %}{{ myItem | safe }}', { test: '\n' }) === '<br/>');
      assert(mus.renderString('{% if test | isNull %}hello{% endif %}', { test: null }) === 'hello');
    });
  });

  describe('other test', () => {
    it('should support cache template', () => {
      const mus = new Mus();
      assert(mus.renderString('{{ test }}', { test: 123 }) === '123');
      assert(mus.renderString('{{ test }}', { test: 321 }) === '321');
    });

    it('should throw error when meeting unknown filter', (done) => {
      try {
        mus.renderString('{{ test | aaa }}', { test: { a: '1' } })
      } catch (e) {
        return done();
      }

      throw new Error('not throw error')
    });

    it('should support self-defined filter', () => {
      mus.setFilter('aaa', str => `${str}aaa`);
      assert(mus.renderString('{{ test | aaa }}', { test: '123' }) === '123aaa');
    });

    it('should throw error when meeting unknown block', (done) => {
      try {
        mus.renderString('{% say %}');
      } catch (e) {
        return done();
      }

      throw new Error('not throw error')
    });

    it('should run without error when has no endfor', () => {
      const html = mus.renderString(`
      {% if test %}
        {% for item in list %}
          <div>{{ item }}</div>
      {% endif %}
    `, { test: true, list: [1, 2] });

      assert(html.indexOf('<div>1</div>') >= 0);
      assert(html.indexOf('<div>2</div>') >= 0);
    });

    it('should support complex nested', () => {
      const html = mus.renderString(
        `{% extends 'test' %}
       {% block main %}
        {% include 'test2' %}
       {% endblock %}`,
        {
          test: '123',
          html: '<div>123\n321</div>',
          list: [{
            url: 'http://baidu.com',
            name: 'test',
            show: false,
            subjects: [{ subName: 'subjects1' }, { subName: 'subjects2' }]
          }, {
            name: 'test2',
            show: true,
          }]
        });

      assert(html.indexOf('default script') >= 0);
      assert(html.indexOf('aa {% {{ bla bla') >= 0);
      assert(html.indexOf('{% if test2 %}') >= 0);
      assert(html.indexOf('{{ test }}') >= 0);
      assert(html.indexOf('test：subjects1true') >= 0);
      assert(html.indexOf('test：subjects2true') >= 0);
      assert(html.indexOf('<a href="http://baidu.com">') >= 0);
      assert(html.indexOf('&lt;div&gt;123') >= 0);
      assert(html.indexOf('hidden msg') >= 0);
    });

    it('should throw error when file is not exist', done => {
      try {
        mus.render('asd');
      } catch (e) {
        done();
      }

      throw new Error('not throw error');
    });
  });
});
