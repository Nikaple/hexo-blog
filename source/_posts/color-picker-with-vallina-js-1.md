---
title: 原生JS实现一个Chrome DevTools取色板（上）
date: 2017-08-03 21:33:41
tags: [前端, JavaScript, Color-picker]
---
使用Chrome DevTools做开发的同学应该都知道，Chrome开发工具中的取色板简直是网页设计时神一般的存在，不仅可以实时预览页面样式，配合插件还可以直接保存到本地，可谓debug一把手。今天就来试试用原生JS还原一个取色板吧！DevTools取色板预览：
<!-- more -->
<img src="http://ot8662avo.bkt.clouddn.com/17-7-27/16835144.jpg" alt="preview" style="display: block; margin: 0 auto;">

图中不仅包含了取色、调节色相、调节透明度、颜色预览等基本功能外，还可以使用三种方式：`HEX`, `RGBA`, `HSLA`输出颜色代码。此外，取色板还包括了一个屏幕取色器（JS无法实现），以及一个下方的自定义色板的功能（暂未实现）。本文将会实现的效果如图：

<img src="http://ot8662avo.bkt.clouddn.com/17-7-27/86474705.jpg" alt="preview" style="display: block; margin: 0 auto;">

### 静态页面搭建

#### 原型实现

这次我们采用基本的浮动布局，首先搭建基本的`HTML`骨架，这部分较为简单：

```html
<div class="wrapper">
  <div class="color-picker" name="color">
     <div class="color-indicator" name="color"></div>
  </div>
  <div class="preview"></div>
  <div class="hue palette" name="hue">
    <div class="slider" name="hue"></div>
  </div>
  <div class="alpha palette" name="alpha">
     <div class="slider" name="alpha"></div>
  </div>
  <h5 class="hex result">#fff</h5>
  <h5 class="rgb result">rgba(255, 255, 255, 1)</h5>
  <h5 class="hsl result">hsla(0, 0%, 100%, 1)</h5>
</div>
<div class="target">Change my color pls!</div>
```

其中，`div.color-indicator`为色盘上的游标，两个`div.slider`为色相、透明度控件上的滑块。为了布局方便，这里不考虑响应性全部采用`px`为单位布局，代码如下：

```css
@import url(https://fonts.googleapis.com/css?family=Quicksand);

html, body {
  margin: 0;
  box-sizing: border-box;
}
body {
  background-color: #333;
  font-family: 'Quicksand', sans-serif;
  padding-top: 100px;
}

.wrapper {
  background: white;
  margin: 0 auto;
  width: 200px;
  height: 265px;
  border-radius: 3px;
  border: 1px solid #666;
  cursor: default;
}

.color-picker {
  width: 200px;
  height: 120px;
  margin-bottom: 15px;
  border-radius: inherit;
  background: darkred;
  overflow: hidden;
}

.preview {
  background: darkgreen;
  float: left;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-left: 12px;
  border: 1px solid #eee;
}

.palette {
  background: darkblue;
  width: 120px;
  height: 12px;
  margin-left: 60px;
  position: relative;
  border-radius: 1px;
  margin-bottom: 10px;
}

.result {
  color: #aaa;
  margin: 0;
  line-height: 2;
  text-align: center;
  cursor: text;
}

.target {
  width: max-content;
  margin: 0 auto;
  padding-top: 10px;
  color: white;
  font-size: 24px;
  cursor: pointer;
}
```

由于等会要给`div.target`绑定点击事件触发取色板，这里将该元素的宽度设置为~~`max-content`~~（←兼容性不好，使用时一定要加`fallback`），可以将宽度由`100%`缩减为文字部分的实际宽度。到这一步之后效果如下：

<iframe width="100%" height="400" src="//jsfiddle.net/Nikaple/zhh8qv7x/6/embedded/html,css,result/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>



#### 样式加工

接下来便是将取色板上的CSS样式由易到难逐个击破的时间。

1. 色板底部小三角

   使用伪元素完成。为了使小三角能与父元素有相同的背景颜色与边框，这里并没有采用`border-radius`模拟三角形，而是使用`background: linear-gradient()`。另外，使用绝对定位时应该为父元素设置`position: relative`属性。

   ```css
   .wrapper {
     position: relative;
   }
   .wrapper::after {
     content: '';
     position: absolute;
     width: 10px;
     height: 10px;
     top: 260px;
     left: 94px;
     background: linear-gradient(135deg, transparent 50%, white 50%);
     border-width: 1px 1px 0 0 inherit solid;
     transform: rotate(45deg);
   }
   ```

2. 色相滑块

   也是使用`linear-gradient`，为了颜色的连贯性必须多加几个色标。

   ```css
   .hue {
     background: linear-gradient(to left,
       hsl(0, 100%, 50%) 0%,
       hsl(30, 100%, 50%) 8.33%,
       hsl(60, 100%, 50%) 16.67%,
       hsl(90, 100%, 50%) 25%,
       hsl(120, 100%, 50%) 33.33%,
       hsl(150, 100%, 50%) 41.67%,
       hsl(180, 100%, 50%) 50%,
       hsl(210, 100%, 50%) 58.33%,
       hsl(240, 100%, 50%) 66.67%,
       hsl(270, 100%, 50%) 75%,
       hsl(300, 100%, 50%) 83.33%,
       hsl(330, 100%, 50%) 91.67%,
       hsl(0, 100%, 50%) 100%);
   }
   ```

3. 取色板渐变

   取色板渐变由三个部分组成：

   - 明度渐变： `linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 1))`
   - 饱和度渐变：`linear-gradient(to left, rgba(0, 0, 0, 0), rgba(255, 255, 255, 1))`
   - 底色：`background-color`

   将这三个背景叠加在一起，便形成了我们的取色盘。当我们需要改变色盘的颜色时，只需改变`background-color`的色相即可。

   ```css
   .color-picker {
     background: linear-gradient(to bottom, rgba(0, 0, 0, 0), rgba(0, 0, 0, 1)), linear-gradient(to left, rgba(0, 0, 0, 0), rgba(255, 255, 255, 1));
     background-color: red;
   }
   ```

4. 透明度滑块及预览颜色

   棋盘图现在已经成为了公认的表示透明区域的方法了。它也可以通过渐变来实现，只不过需要利用斜向45°的（0, 25, 75, 100）四个色标的渐变将矩形切割成两个三角形加上中间的六边形。棋盘图的画法在《CSS揭秘》一书中有较为详细的解读，这里不做赘述：

   ```css
   .alpha {
      background:
        linear-gradient(to right, rgba(0,0,0,0), rgba(0,0,255,1)) 0 0 / cover,
        linear-gradient(45deg, rgba(0,0,0,.25) 25%, transparent 0, transparent 75%, rgba(0,0,0,.25) 0) 0 0 / 12px 12px,
        linear-gradient(45deg, rgba(0,0,0,.25) 25%, transparent 0, transparent 75%, rgba(0,0,0,.25) 0) 6px 6px / 12px 12px;
   }

   .preview {
     background:
        linear-gradient(45deg, rgba(0,0,0,.25) 25%, transparent 0, transparent 75%, rgba(0,0,0,.25) 0) 0 0 / 12px 12px,
        linear-gradient(45deg, rgba(0,0,0,.25) 25%, transparent 0, transparent 75%, rgba(0,0,0,.25) 0) 6px 6px / 12px 12px;
     background-color: rgba(255,0,0,0.5);
   }
   ```

   透明度滑块与预览颜色不同的地方在于，透明度滑块的棋盘图上面还需要加一层当前颜色的渐变，而预览颜色区域只需要加上一个背景即可。预览：

<iframe width="100%" height="400" src="//jsfiddle.net/Nikaple/zhh8qv7x/7/embedded/html,css,result/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

#### 交互设计

由于省略了`HEX`, `RGB`, `HSL`的切换按钮，这里的交互一共只有3个：色盘、色相滑块、透明度滑块。

首先我们为色盘游标增加一点基本样式：

```css
.color-indicator {
  position: relative;
  left: -6px;
  top: -6px;
  width: 12px;
  height: 12px;
  transform: translate(-6px, -6px);
  border-radius: 50%;
  border: 1px solid white;
}
```

这里为了让色盘游标移动的中心位于圆心，加上了`relative`以及`left`、`top`属性，接着再用`translate`将它移至屏幕外；接着，定义滑块的公共样式：

```css
.slider {
  position: relative;
  left: -8px;
  top: -2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  transform: translateX(120px);
  background: rgb(248, 248, 248);
  filter: drop-shadow(2px 2px 3px rgba(0,0,0,.2));
}
```

由于初始滑块位置在右侧，这里直接使用`translateX(120px)`将两个滑块均移动`120px`靠近右侧，并且也用`left`与`top`对槽内相对位置进行定位。这里利用`border-radius`将滑块变换为圆形之后，就不能使用`box-shadow`对其进行描边了（`box-shadow`产生的阴影只能为矩形）。这里使用了`filter`中的`drop-shadow`滤镜属性，目前仅`IE`不支持。



到这里界面部分就结束啦，交互逻辑请看下期！

<iframe width="100%" height="400" src="//jsfiddle.net/Nikaple/zhh8qv7x/8/embedded/html,css,result/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>