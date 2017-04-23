<div>
  干扰 bla bla {{ test }}

  {% set obj = {
    list: [1, 2, 3],
    test2: {
      test3: test
    }
  } %}

  {% for item in obj.list %}
    {{ item }}{{ obj.test2.test3 }}
  {% endfor %}

  {% for item in list %}
    <a href="{{ item.url }}">
      {{ item.name | upper }}
      {% if item.show %}( hidden msg ){% endif %}

      {% if item.subjects %}
        {% for sub in item.subjects | reverse %}
          <span>{{ item.name }}：{{ sub.subName | upper | lower }}</span>
        {% endfor %}
      {% endif %}
    </a>
  {% endfor %}

  {% if list and list.length < 1 %}
    other hidden msg
  {% else %}
    {% if test2 %}
      {{ test }}
    {% else %}
      aaaa {{ test | replace('2', '3') }}
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