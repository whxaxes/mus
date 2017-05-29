{{ test1 | replace(r/[0-9]/g, 'a') }}
{{ test2 | replace(r/[a-z]/gi, 'b') }}
{{ test3 | replace(r/\/([a-z]+)/g, '\\$1') }}

{% if r/^foo.*/.test(test4) %}
  regexp
{% endif %}
