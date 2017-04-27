{% extends "layout.tpl" %}

{% block body %}
  {% css "common/common.css" %}
  {% require "common/global.css" %}

  {% require "part1" %}

  {% require "part2" %}

  {% style atf=false %}
    body { background-color: #eee; }
  {% endstyle %}
{% endblock %}