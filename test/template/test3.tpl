{% extends './test.tpl' %}

{% block main %}
  <div>
    test3.tpl content
  </div>
{% endblock %}

{% block script %}
  {% include "./test4.tpl" %}
{% endblock %}