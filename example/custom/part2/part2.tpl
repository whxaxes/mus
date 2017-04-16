<div class="part2">
  <div class="title">
    this is part 2
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
.part2 {
  margin-top: 40px;
  padding: 10px;
  border: 4px solid #000;
}
{% endstyle %}

{% script %}
document.querySelector('.part2').onclick = function(){
  alert('part2');
}
{% endscript %}