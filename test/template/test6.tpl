<div>
  干扰 bla bla {{ test }}

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

  {% if list.length < 1 %}
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