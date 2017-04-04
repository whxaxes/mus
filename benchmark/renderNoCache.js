'use strict';

const Benchmark = require('benchmark');
const suite = new Benchmark.Suite();
const nunjucks = require('nunjucks');
const Mus = require('../lib');
const mus = new Mus({
  baseDir: 'test/template',
  noCache: true,
});
nunjucks.configure('test/template', {
  noCache: true,
});

const str = `
<div>
  干扰 bla bla {{ test }}

  {% for item in list %}
    <a href="{{ item.url }}">
      {{ item.name }} {% if item.show %}( hidden msg ){% endif %}
       
       {% if item.subjects %}
        {% for sub in item.subjects %}
          <span>{{ item.name }}：{{ sub.subName }}</span>
        {% endfor %}
       {% endif %}
    </a>
  {% endfor %}
  
  {% if list.length < 1 %}
    other hidden msg
  {% else %}
    {% if test2 %}
      {{ test }}
    {% else %}
      aaaa {{ test }}
    {% endif %}
  {% endif %}

  {% raw %}
    {{ test }}
    
    {% if test2 %}
      aaaa {{ test }}
    {% endif %}
  {% endraw %}
  
  {{ html }}

  {{ list | safe }}
</div>
`;

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

// add tests
suite
  .add('Mus#renderNoCache', function() {
    mus.renderString(str, obj);
  })
  .add('Nunjucks#renderNoCache', function() {
    nunjucks.renderString(str, obj);
  })
  // add listeners
  .on('cycle', function(event) {
    console.log(String(event.target));
  })
  .on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  .run();
