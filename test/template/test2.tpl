<div>
  aa {% {{ bla bla {{ test }}

  {% for item in list %}
    <a href="{{ item.url }}">
      {{ item.name }} {% if item.show %}( hidden msg ){% endif %}

      {% if item.subjects %}
        {% for sub, index in item.subjects %}
          <span>{{ item.name }}：{{ sub.subName }}{{ loop.index0 === index }}</span>
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