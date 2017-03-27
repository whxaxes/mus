<div>
  干扰 bla bla {{ test }}



  {% raw %}
    {{ test }}

    {% if test2 %}
    aaaa {{ test }}
    {% endif %}
  {% endraw %}

  {{ num.replace('aaaa') }}
</div>