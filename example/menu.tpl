<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport"
        content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>Menu</title>
  <style>
    a {
      display: block;
      height: 40px;
      line-height: 40px;
      text-align: center;
      color: #333;
      margin: 10px 0;
      border: 1px solid #ddd;
      font-size: 20px;
      text-decoration: none;
    }

    a:hover {
      background-color: #eee;
    }
  </style>
</head>
<body>
<div class="demo-list">
  {% for item in dirList %}
    <a class="item" href="{{ item + '/index' }}">
      {{ item }}
    </a>
  {% endfor %}
</div>
</body>
</html>