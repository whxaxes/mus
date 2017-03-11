{% macro item(what) %}
  {{ test }}{{ what }}
{% endmacro %}

{{ item() }}
{{ item('333333') }}
