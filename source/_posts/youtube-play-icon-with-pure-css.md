---
title: 纯CSS实现Youtube视频播放按钮动画
date: 2017-06-18 19:28:02
tags: [CSS, Youtube, Animation]
---
前两天在 Youtube 上看视频时，无意间发现视频播放器的播放暂停切换按钮动画十分流畅，于是就想试着用 CSS 仿制一下，先上效果图：

<img src="http://ot8662avo.bkt.clouddn.com/17-7-26/89316020.jpg" alt="preview" style="display: block; margin: 0 auto;">

等等，暂停按钮可以用`border-left`与`border-right`实现，播放的[三角形](https://css-tricks.com/examples/ShapesOfCSS/)也可以用边框实现，这岂不是骗小孩子的把戏？于是乎没几分钟，我们就可以写出这么一个实现：
<!-- more -->
<iframe width="100%" height="300" src="//jsfiddle.net/Nikaple/3585q1dd/3/embedded/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

可是致命的缺陷是，由于暂停按钮中间缝隙的关系，我们必须对`width`元素进行动画处理，这直接导致`border-width`的动画无法按照我们设想的方式工作。于是乎，换个方向考虑，只能使用伪元素或者再添加一个`div`元素将两个边框分别实现了。

在这里为了布局方便，能够使用`flex`布局，使用两个`div`来实现，实际也可以只用一个`div`配合伪元素以及普通定位方式来获得更好的兼容性。

首先用两个`div`的边框模拟出暂停按钮的两个大长棍：

```html
<head>
  <style>
    body {
      background-color: #333;
    }
    .wrapper {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin: 32px;
      width: 32px;
      height: 32px;
    }
    .box {
      width: 0;
      height: 24px;
      border-left: 8px solid white;
    }
    .left {
      margin-left: 6px;
    }

    .right {
      margin-right: 6px;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="box left"></div>
    <div class="box right"></div>
  </div>
</body>
```

然后为外层`div`添加一个`click`事件，在`click`事件触发时`toggle`两个子`div`元素的`active`类：

```javascript
$div = document.querySelector('.wrapper');
$div.addEventListener('click', () => {
  [...$div.children].forEach(element => {
    element.classList.toggle('active');
  });
});
```

接下来我们就得定义这两根大棒在`active`状态下的属性了：左边的大棒在`active`状态下变换为梯形，右边的大棒在`active`状态下变换为三角形，且梯形的腰与三角形的两条边要在同一条直线上。这就要求`border-left-width`与`border-top-width`的比值一定，即可以使用公共的`border-width`系列属性。在这里为了让上下边框也能受到`transition`属性的影响，在`.box`中也要定义初始值。

```css
.box {
  width: 0;
  height: 24px;
  transition: all 0.2s;
  border-left: 8px solid white;
  border-top: 0 solid transparent;
  border-bottom: 0 solid transparent;
}
.box.active {
  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  border-left: 10px solid white;
}
```

为了使右边的大棒在`active`状态下缩小为三角形，需要将其高度设置为`0`；为了使左边的大棒缩小为梯形，需要将其高度设置为短边的长度，即`24px/2 = 12px`：

```css
.right.active {
  height: 0;
}
.left.active {
  height: 12px;
}
```

到这里这个简单的 CSS 动画就完成啦，完成效果：

<iframe width="100%" height="300" src="//jsfiddle.net/Nikaple/4dodckc5/3/embedded/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>



当然，如果要完全不使用`JavaScript`，则可以使用`input`复选框与`label`标签的`:active`伪类以及`::before`、`::after`伪元素来实现，只不过语义性会有一定的缺失。并且，由于没有`flexbox`黑科技的支持，居中定位会变得麻烦一点。

<iframe width="100%" height="300" src="//jsfiddle.net/Nikaple/4dodckc5/4/embedded/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>