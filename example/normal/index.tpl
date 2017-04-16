{% extends "layout" %}

{% block body %}
  <div class="page">
    <div class="list">
      {% for item in dataList | reverse %}
        {% set isAdult = item.age >= 18 %}
        <div class="item {{ isAdult ? 'adult' : '' }}">
          <span class="name">
            {{ item.name }}
          </span>
          <span class="age">
            {{ item.age }}
          </span>
          <span class="type">
            {{ isAdult ? 'adult' : 'child' }}
          </span>
        </div>
      {% endfor %}
    </div>
  </div>
{% endblock %}

{% block style %}
  <style>
    .item {
      display: -webkit-box;
      padding: 5px;
      height: 30px;
      line-height: 30px;
      border: 1px solid #ccc;
      margin: 5px;
      cursor: pointer;
    }

    .adult {
      background-color: green;
    }

    span {
      display: block;
      -webkit-box-flex: 1;
      width: 100%;
      height: 100%;
      text-align: center;
    }

    .age {
      background-color: #f5f5f5;
    }
  </style>
{% endblock %}

{% block script %}
  <script>
    [].slice.call(document.querySelectorAll('.item'))
        .forEach(item => {
          item.onclick = function() {
            alert('yo');
          }
        })
  </script>
{% endblock %}