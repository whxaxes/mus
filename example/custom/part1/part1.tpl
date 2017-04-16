<div class="part1">
  <div class="title">
    this is part 1
  </div>

  <div class="content">
    {% for item in dataList | reverse %}
      {% set isAdult = item.age >= 18 %}
      <div class="item {{ isAdult ? 'adult' : '' }}">
        <span class="name">{{ item.name }}</span>
        <span class="age">{{ item.age }}</span>
        <span class="type">{{ isAdult ? 'adult' : 'child' }}</span>
      </div>
    {% endfor %}
  </div>
</div>

{% style %}
.part1 {
  padding: 10px;
  border: 4px solid red;
}
{% endstyle %}

{% script %}
document.querySelector('.part1').onclick = function(){
  alert('part1');
}
{% endscript %}