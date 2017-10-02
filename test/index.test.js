'use strict';

const mus = require('../lib');
const Mus = mus.Mus;
const assert = require('power-assert');
const path = require('path');
const utils = require('../lib/utils/utils');
mus.configure({
  baseDir: 'test/template',
  ext: 'tpl',
  noCache: true,
});

describe('lib#index', () => {
  describe('test base feature', () => {
    it('should support variable', () => {
      assert(mus.renderString('<div>{{ test }}</div>', { test: '123' }) === '<div>123</div>');
      assert(mus.renderString('<div>{{ test || "" }}</div>', { test: null }) === '<div></div>');
      assert(mus.renderString('<div>{{ test || "" }}</div>', { test: undefined }) === '<div></div>');
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
      assert(mus.renderString('<div>{{ `${test}123` }}</div>', { test: '123' }) === '<div>123123</div>');
    });

    it('should support smarty style expression', () => {
      assert(mus.renderString('<div>{{ test1 or test2 }}</div>', { test1: false, test2: '123' }) === '<div>123</div>');
      assert(mus.renderString('<div>{{ not test1 }}</div>', { test1: false }) === '<div>true</div>');
      assert(mus.renderString('<div>{{ test1 and test2 }}</div>', { test1: true, test2: '123' }) === '<div>123</div>');
      assert(mus.renderString('<div>{{ not test1 and test3 or test2 }}</div>', {
          test1: false,
          test2: '123'
        }) === '<div>123</div>');
    });

    it('should support if condition in variable', () => {
      assert(mus.renderString('<div>{{ "123" if test1 }}</div>', { test1: true }) === '<div>123</div>');
      assert(mus.renderString('<div>{{ "123" if not test1 }}</div>', { test1: false }) === '<div>123</div>');
      assert(mus.renderString('<div>{{ "123" if test1 else "321" }}</div>', { test1: false }) === '<div>321</div>');
    });

    it('should throw error if expression has grammatical errors', () => {
      try {
        mus.renderString('{{ abc abc }}', { abc: 1 })
      } catch (e) {
        assert(e.message.includes('Unexpected'));
        return;
      }
      throw new Error('didn\'t throw error');
    });

    it('should throw error if expression has error', () => {
      try {
        mus.renderString('{{ abc.replace(1, 2) }}', { abc: 1 })
      } catch (e) {
        assert(e.message.includes('abc.replace is not a function'));
        return;
      }
      throw new Error('didn\'t throw error');
    });

    // .replace(1, 2)
    it('should support self-defined blockStart and variableStart', () => {
      const mus = new Mus({
        baseDir: 'test/template',
        blockStart: '<%',
        blockEnd: '%>',
        variableStart: '<%=',
        variableEnd: '%>',
      });

      assert(mus.render('test8', { test: '123' }).includes('123'));
      assert(mus.renderString('<% if test %><div><%= test %></div><% endif %>', { test: '123' }) === '<div>123</div>');
    });

    it('should render without escape if autoescape setting was false', () => {
      const mus = new Mus({
        autoescape: false,
      });

      assert(mus.renderString('{{ test }}', { test: '<div></div>' }) === '<div></div>');
    });

    it('should throw the error if the blockStart are the same as variableStart', () => {
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
        assert(e.message.includes('blockStart should be different with variableStart'));
        return;
      }

      throw new Error('didn\'t throw error');
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

    it('should support elif as elseif', () => {
      const html = '{% if test %}<div>{{ test }}</div>{% elif gg === "123" %}{{ gg }}{% else %}321{% endif %}';
      assert(mus.renderString(html, { test: '123' }) === '<div>123</div>');
      assert(mus.renderString(html, { gg: '123' }) === '123');
      assert(mus.renderString(html) === '321');
    });

    it('should throw error if ifBlock has no condition', () => {
      try {
        mus.renderString('{% if %}<div>{{ test }}</div>{% endif %}')
      } catch (e) {
        assert(e.message.includes('if condition invalid'));
        return;
      }
      throw new Error('didn\'t throw error');
    });

    it('should throw error if elseifBlock has no condition', () => {
      try {
        mus.renderString('{% if test %}<div>{{ test }}</div>{% elseif %}{{ gg }}{% else %}321{% endif %}')
      } catch (e) {
        assert(e.message.includes('elseif condition invalid'));
        return;
      }
      throw new Error('didn\'t throw error');
    });

    it('should throw error if elseBlock behind elseifBlock', () => {
      try {
        mus.renderString('{% if test %}<div>{{ test }}</div>{% else %}321{% elseif gg %}{{ gg }}{% endif %}')
      } catch (e) {
        assert(e.message.includes('else behind elseif'));
        return;
      }
      throw new Error('didn\'t throw error');
    });

    it('should throw error if has no ifBlock', () => {
      try {
        mus.renderString('{% elseif gg %}{{ gg }}{% else %}321{% endif %}')
      } catch (e) {
        assert(e.message.includes('if block not found'));
        return;
      }
      throw new Error('didn\'t throw error');
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

    it('should throw error if has no iterator', () => {
      try {
        mus.renderString('{% for item in  %}<div>{{ test }}</div>{% endfor %}')
      } catch (e) {
        assert(e.message.includes('expression invalid'));
        return;
      }
      throw new Error('didn\'t throw error');
    });
  });

  // set
  describe('test set', () => {
    it('should support set', () => {
      const html = '{% for item in list %}{% set sub = 123123 %}{{ sub }}{% endfor %}{{ sub }}';
      assert(mus.renderString(html, { list: [1] }) === '123123');
    });

    it('should support set object', () => {
      const html = '{% set sub = { abc: 123 } %}{{ sub.abc }}';
      assert(mus.renderString(html) === '123');
    });

    it('should support set expression', () => {
      assert(mus.renderString(`{% set isAdult = item.age >= 18 %}{{ isAdult ? 'adult' : '' }}`, {
          item: { age: 20 },
        }) === 'adult');
    });

    it('should throw error if has no key-value', () => {
      try {
        mus.renderString('{% set %}')
      } catch (e) {
        assert(e.message.includes('set expression invalid'));
        return;
      }
      throw new Error('didn\'t throw error');
    });

    it('should throw error if only has key', () => {
      try {
        mus.renderString('{% set key =  %}')
      } catch (e) {
        assert(e.message.includes('expression invalid'));
        return;
      }
      throw new Error('didn\'t throw error');
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
      assert(mus.renderString('{% macro test(a = "123") %}{{ a }}{% endmacro %}{{ test() }}') === '123');
      assert(mus.renderString('{% macro test %}123{% endmacro %}{{ test() }}') === '123');
    });

    it('should support macro use parent\'s scope', () => {
      const str = '{% macro test(a) %}({{ a }}{{ item }}){% endmacro %}{% for item in list %}{{ test("123") }}{{ test("321") }}{% endfor %}';
      assert(mus.renderString(str, { list: [1, 2] }) === '(1231)(3211)(1232)(3212)');
    });

    it('should throw error if has no name', () => {
      try {
        mus.renderString('{% macro %}asd{% endmacro %}')
      } catch (e) {
        assert(e.message.includes('macro name was needed'));
        return;
      }
      throw new Error('didn\'t throw error');
    });
  });

  describe('test import', () => {
    it('should support import', () => {
      assert(mus.renderString('{% import "test4" %}{{ item("333333") }}', { test: 123 }).includes('123333333'));
      assert(mus.renderString('{% import "test4" as obj %}{{ obj.item("333333") }}', { test: 123 }).includes('123333333'));
    });

    it('should warning if import a non-macro template', done => {
      const saveOut = process.stdout.write;
      process.stdout.write = function(msg) {
        process.stdout.write = saveOut;
        assert(msg.includes('macro'));
        done();
      };

      assert(mus.renderString('{% import "test" %}'));
    });

    it('should throw error if url not found', () => {
      try {
        mus.renderString('{% import %}')
      } catch (e) {
        assert(e.message.includes('import url not found'));
        return;
      }
      throw new Error('didn\'t throw error');
    });
  });

  describe('test filter', () => {
    it('should support filter tag', () => {
      assert(mus.renderString('{% filter replace(123, 321) %}123{% endfilter %}') === '321');
      assert(mus.renderString(
          '{% filter replace(123, 321) %}{% for item in list %}{{ item }}{% endfor %}{% endfilter %}',
          { list: [123, 321, 123] }
        ) === '321321321');
    });

    it('should throw error if filter tag has not function', done => {
      try {
        mus.renderString('{% filter %}123{% endfilter %}');
      } catch (e) {
        assert(e.message.includes('filter function not found'));
        done();
      }
      throw new Error('didn\'t throw error');
    });
  });

  describe('extends&block', () => {
    it('should support extends and block', () => {
      const html = mus.render('test3', { title: 'special title' });
      assert(html.includes('special title'));
      assert(html.includes('test3.tpl content'));
      assert(!html.includes('test.tpl content'));
    });

    it('should throw error if extendsBlock has no url', () => {
      try {
        mus.renderString('{% extends %}')
      } catch (e) {
        assert(e.message.includes('extends url invalid'));
        return;
      }
      throw new Error('didn\'t throw error');
    });

    it('should throw error if block has no name', () => {
      try {
        mus.renderString('{% block %}{% endblock %}')
      } catch (e) {
        assert(e.message.includes('block name invalid'));
        return;
      }
      throw new Error('didn\'t throw error');
    });
  });

  describe('include', () => {
    it('should support include', () => {
      const html = mus.render('test3.tpl', { title: 'special title', test: '112233' });
      assert(html.includes('112233'));
      assert(html.includes('112233333333'));
    });

    it('should support string args', () => {
      const html = mus.renderString('{% include "test7" num="bbbb" %}', { test: '333' });
      assert(html.includes('111'));
      assert(html.includes('333'));
      assert(!html.includes('bbbb'));
    });

    it('should support multi args', () => {
      const html = mus.renderString(
        '{% include "test7" num = obj.test2 + obj.test test = obj.test %}',
        { obj: { test: 'yo!', test2: 'bbbb' } }
      );
      assert(html.includes('111yo!'));
      assert(html.includes('bla yo!'));
      assert(!html.includes('bbbb'));
    });

    it('should throw error if include url not exist', () => {
      try {
        mus.renderString(
          '{% include  %}',
          { obj: { test: 'yo!', test2: 'bbbb' } }
        );
      } catch (e) {
        assert(e.message.includes('parse error, include url invalid'));
        return;
      }
      throw new Error('didn\'t throw error');
    });

    it('should throw error if include url not illegal', () => {
      try {
        mus.renderString(
          '{% include "" %}',
          { obj: { test: 'yo!', test2: 'bbbb' } }
        );
      } catch (e) {
        assert(e.message.includes('include url invalid'));
        return;
      }
      throw new Error('didn\'t throw error');
    });

    it('should throw error if args has error', () => {
      try {
        mus.renderString(
          '{% include "test" test = fuc fuc %}',
          { obj: { test: 'yo!', test2: 'bbbb' } }
        );
      } catch (e) {
        assert(e.message.includes('Unexpected identifier'));
        return;
      }
      throw new Error('didn\'t throw error');
    });
  });

  describe('filter', () => {
    it('should support filter ', () => {
      assert(mus.renderString('{{ "\n" | safe | nl2br}}') === '<br/>');
      assert(mus.renderString('{{ test | safe | nl2br}}', { test: 'a\nb<div>' }) === 'a<br/>b<div>');
      assert(mus.renderString('{{ test | escape | nl2br() | safe }}', { test: 'a\nb<div>' }) === 'a<br/>b&lt;div&gt;');
      assert(mus.renderString('{{ test | json | safe }}', { test: { a: '1' } }) === JSON.stringify({ a: '1' }));
      assert(mus.renderString('{{ test | nl2br | safe }}', { test: 'a\nb' }) === 'a<br/>b');
      assert(mus.renderString('{{ test | nl2br | json }}', { test: null }) === '{}');
      assert(mus.renderString('{{ ["a", 2, 3] | reverse | join("|") | upper }}') === '3|2|A');
    });

    it('should support filter in block', () => {
      mus.setFilter('isNull', val => val === null);
      assert(mus.renderString('{% for item in [1, 2] | reverse %}{{ item }}{% endfor %}') === '21');
      assert(mus.renderString('{% set myItem = test | nl2br %}{{ myItem | safe }}', { test: '\n' }) === '<br/>');
      assert(mus.renderString('{% if test | isNull %}hello{% endif %}', { test: null }) === 'hello');
    });

    it('should support pass arguments to filter', () => {
      assert(mus.renderString('{{ test | replace("1", "2") }}', { test: '1' }) === '2');
      assert(mus.renderString('{{ test | replace("1") }}', { test: '1' }) === '');
    });

    it('should support pass arguments to self-define filter', () => {
      mus.setFilter('passArg', (val, key) => val + key);
      assert(mus.renderString('{{ test | passArg("23") }}', { test: '1' }) === '123');
      assert(mus.renderString('{{ test | passArg("\n") | nl2br | safe }}', { test: '1' }) === '1<br/>');
    });

    it('should throw error if filter illegal', done => {
      try {
        mus.renderString('{{ test | passArg("23" }}', { test: '1' })
      } catch (e) {
        done();
      }
      throw new Error('didn\'t throw error');
    });
  });

  describe('custom tag test', () => {
    it('should support register an unary custom tag', () => {
      const mus = new Mus();
      mus.setTag('css', {
        unary: true,
        attrName: 'href',
        render(attr) {
          return `<link href="${attr.href}" rel="stylesheet">`;
        }
      });

      assert(mus.renderString('{% css "stylesheet.css" %}') === '<link href="stylesheet.css" rel="stylesheet">');
      assert(mus.renderString('{% css href %}', { href: 'stylesheet.css' }) === '<link href="stylesheet.css" rel="stylesheet">');
      assert(mus.renderString('{% css href=url %}', { url: 'stylesheet.css' }) === '<link href="stylesheet.css" rel="stylesheet">');
    });

    it('should support register a multinary custom tag', () => {
      const mus = new Mus();
      mus.setTag('style', {
        noAttr: true,
        render(attr, scope, compiler) {
          return `<style>${compiler.compile(this.children, scope)}</style>`
        }
      });

      assert(mus.renderString('{% style %}.text{margin: 10px;}{% endstyle %}') === '<style>.text{margin: 10px;}</style>');
    });

    it('should run without error if render function has no return', () => {
      const mus = new Mus();
      mus.setTag('ooo', {
        noAttr: true,
        render(attr, scope, compiler) {}
      });
      assert(mus.renderString('{% ooo %}.text{margin: 10px;}{% endooo %}') === '');
    });

    it('should support include other template', () => {
      mus.setTag('require', {
        attrName: 'url',
        unary: true,
        render(attr, scope, compiler) {
          const realUrl = path.join(__dirname + '/template', attr.url);
          return compiler.include(realUrl, scope);
        }
      });

      const html = mus.renderString('{% require "test2.tpl" %}');
      assert(html.includes('aa {% {{ bla bla'));
    });

    it('should throw error if attr illegal', () => {
      try {
        mus.renderString('{% require abc aaa %}');
      } catch (e) {
        assert(e.message.includes('Unexpected identifier'));
        return;
      }
      throw new Error('didn\'t throw error');
    });

    it('should throw error if register a build-in tag', () => {
      const mus = new Mus();
      try {
        mus.setTag('include', {
          render() {}
        });
      } catch (e) {
        assert(e.message.includes('build-in tag'));
        return;
      }
      throw new Error('didn\'t throw error');
    });

    it('should throw error without render function', () => {
      const mus = new Mus();
      try {
        mus.setTag('hole', {});
      } catch (e) {
        assert(e.message.includes('render function must exist'));
        return;
      }
      throw new Error('didn\'t throw error');
    });

    it('should throw error without tagObj', () => {
      const mus = new Mus();
      try {
        mus.setTag('hole');
      } catch (e) {
        assert(e.message.includes('render function must exist'));
        return;
      }
      throw new Error('didn\'t throw error');
    });
  });

  describe('other test', () => {
    it('should support cache template', () => {
      const mus = new Mus();
      assert(mus.renderString('{{ test }}', { test: 123 }) === '123');
      assert(mus.renderString('{{ test }}', { test: 321 }) === '321');
    });

    it('should support global function', () => {
      assert(mus.renderString('{% for item in range(1, 5) %}{{ item }}{% endfor %}') === '1234');
      assert(mus.renderString('{{ \'123asd\' | replace(regular(\'\\\\d\', \'g\'), \'g\') }}') === 'gggasd');
      assert(mus.renderString('{{ range }}{{ regular }}', { range: '123', regular: '' }) === '123');
    });

    it('should support compress', () => {
      const mus = new Mus({ compress: true });
      assert(mus.renderString('{% for item in range(1, 5) %}\n  {{ item }}\n{% endfor %}') === '1234');
      assert(mus.renderString(`
      {% for item in range(1, 5) %}
        {{ item }}
      {% endfor %}
      <script>
        // 13123
        const a = 123;
      </script>
      `) === '1234<script>// 13123\nconst a = 123;</script>');
    });

    it('should throw error when render error', () => {
      try {
        mus.render('test7', { num: 11 });
      } catch (e) {
        assert(e.message.includes('replace is not a function'));
        return;
      }
      throw new Error('didn\'t throw error');
    });

    it('should throw error when meeting unknown filter', () => {
      try {
        mus.renderString('{{ test | aaa }}', { test: { a: '1' } })
      } catch (e) {
        return;
      }

      throw new Error('didn\'t throw error');
    });

    it('should support self-defined filter', () => {
      mus.setFilter('aaa', str => `${str}aaa`);
      assert(mus.renderString('{{ test | aaa }}', { test: '123' }) === '123aaa');
    });

    it('should support regexp', () => {
      const str = mus.render('test9', {
        test1: '123',
        test2: 'aBc22',
        test3: '/abc/bba/11',
        test4: 'fooly'
      });
      assert(str.includes('aaa'));
      assert(str.includes('bbb22'));
      assert(str.includes('regexp'));
      assert(str.includes('\\abc\\bba/11'));
    });

    it('should throw error when meeting unknown block', () => {
      try {
        mus.renderString('abasdb\naaa{% say %}');
      } catch (e) {
        return;
      }

      throw new Error('didn\'t throw error')
    });

    it('should run without error when has no endfor', done => {
      const saveOut = process.stdout.write;
      process.stdout.write = function(msg) {
        process.stdout.write = saveOut;
        assert(msg.includes('^^^^'));
        assert(msg.includes('for was not closed'));
        done();
      };

      const html = mus.renderString(`
      {% if test %}
        {% for item in list %}
          <div>{{ item }}</div>
      {% endif %}
    `, { test: true, list: [1, 2] });

      assert(html.includes('<div>1</div>'));
      assert(html.includes('<div>2</div>'));
    });

    it('should run with warning if not close tag', done => {
      const saveOut = process.stdout.write;
      process.stdout.write = function(msg) {
        process.stdout.write = saveOut;
        assert(msg.includes('^^^^'));
        assert(msg.includes('for was not closed'));
        done();
      };

      mus.renderString(`
        {% for item in list %}
          <div>{{ item }}</div>
    `, { list: [1, 2] });
    });

    it('should run without error if has close tag only', () => {
      assert(mus.renderString('<div>{{ item }}</div>{% endfor %}') === '<div></div>');
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

      assert(html.includes('default script'));
      assert(html.includes('aa {% {{ bla bla'));
      assert(html.includes('{% if test2 %}'));
      assert(html.includes('{{ test }}'));
      assert(html.includes('test：subjects1true'));
      assert(html.includes('test：subjects2true'));
      assert(html.includes('<a href="http://baidu.com">'));
      assert(html.includes('&lt;div&gt;123'));
      assert(html.includes('hidden msg'));
    });

    it('should throw error when file is not exist', () => {
      try {
        mus.render('asd');
      } catch (e) {
        return;
      }

      throw new Error('didn\'t throw error');
    });
  });
});
