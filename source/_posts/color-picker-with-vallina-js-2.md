---
title: 原生JS实现一个Chrome DevTools取色板（下）
date: 2017-08-07 20:24:17
tags: [前端, JavaScript, Color-picker]
---
### 拖拽功能

上回我们已经构建了基本界面：

<iframe width="100%" height="400" src="//jsfiddle.net/Nikaple/zhh8qv7x/8/embedded/html,css,result/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>

终于到`JavaScript`出场的时候了！首先观察一下我们的组件，滑块的交互方式其实可以看为仅在`x`轴方向上运动的色盘交互方式。于是我们首先建立一个可拖动对象的类`DragContext`：
<!-- more -->
```javascript
class DragContext {
  constructor({
    \$context, // 可以拖动的范围，即色盘以及滑块槽
    \$dragger, // 可拖动对象，色盘游标以及滑块
    name, // 用来区分两个滑块
    direction // 用来区分仅x轴还是x,y轴均可拖动
  }) {
   	this.\$context = \$context;
    this.\$dragger = \$dragger;
    this.name = name;
    this.direction = direction;
  }
}
```

考虑我们需要实现的效果，可以被拆分为两部分：

- 单击父元素，子元素可以瞬间移动到单击的位置；
- 单击子元素，可以拖动子元素。

很自然地，我们需要为父元素添加`mousedown`, `mousemove`, `mouseup`三个事件。在这里由于我们想当用户鼠标在区域外时，只要不松开左键还能继续拖动滑块，便可以将`mousemove`, `mouseup`这两个事件绑定在全局的`document`对象上。当按下鼠标时，将内部变量`_isDragging`设置为`true`；松开鼠标时，设置为`false`。这样便可通过`_isDragging`来确定元素是否被拖动。当对象正在被拖动时，则执行`_setStyles`函数为`\$dragger`与`\$context`设置样式。（`utils.addHandler(context, event, handler)`为`target`添加回调函数`handler`的`event`事件，关于`utils`对象，可看本文附录）。

```javascript
class DragContext {
  constructor(...){
    ...;
    this._isDragging = false;
    this.init();
  }
  init() {
    this._addMousedown();
    this._addMousemove();
    this._addMouseup();
  }
  getName() {
    return this.name;
  }
  _addMousedown() {
    utils.addHandler(this.\$context, 'mousedown', (e) => {
      // 初始化样式
      this._setStyles(e);
      this._isDragging = true;
    });
  }
  _addMousemove() {
    utils.addHandler(document, 'mousemove', (e) => {
      if (this._isDragging) {
        this._setStyles(e);
      }
    });
  }
  _addMouseup() {
    utils.addHandler(document, 'mouseup', (e) => {
      this._isDragging = false;
    });
  }

  _setStyles(e) {
    this._setDraggerStyles(e);
    this._setContextStyles(e);
  }
  _setDraggerStyles(e) {
    // 设置dragger样式
  }
  _setContextStyles(e) {
    // 设置context样式
  }
}
```

于是，如何确定当前可拖动元素的偏移量便成了一个很关键的问题，在这里我选择了获取基于当前视图的坐标，也就是`e.clientX, e.clientY`以及`element.getBoundingClientRect()`。为此我们需要新的“私有”变量：`this._x, this._y, this._rect`。为了将可拖动元素限制在一定的范围里，我们可以使用一个工具函数：`utils.clamp`，将小于最小值时设置为最小值，大于最大值时设置为最大值。

```javascript
class DragContext {
  constructor({
  	...,
    initX, // 可选，初始化x坐标
    initY // 可选，初始化y坐标
  }){
    ...;
    this._x = initX || 0;
    this._y = initY || 0;
    this._rect = this.\$context.getBoundingClientRect();
  }
  _setDraggerStyles(e) {
    this._x = utils.clamp(e.clientX - this._rect.left, 0, this._rect.width);
    this._y = utils.clamp(e.clientY - this._rect.top, 0, this._rect.height);
    switch (this.direction) {
      case 'horizontal':
        this.\$dragger.style.transform = `translate(\${this._x}px, 0)`;
        break;
      case 'vertical':
        this.\$dragger.style.transform = `translate(0, \${this._y}px)`;
        break;
      case 'both':
        this.\$dragger.style.transform = `translate(\${this._x}px, \${this._y}px)`;
    }
  }
}
```

至此我们可以对目前的组件进行简单的测试了，直接上代码（`jsFiddle`自动在`domready`时加载，不用自己套壳了）：

```javascript
const \$palletes = Array.prototype.slice.call(document.querySelectorAll('.palette'));
const \$sliders = Array.prototype.slice.call(document.querySelectorAll('.slider'));
const \$picker = document.querySelector('.color-picker');
const \$indicator = document.querySelector('.color-indicator');
const contexts = \$palletes.map((\$context) => {
    const name = \$context.getAttribute('name');
    const \$dragger = \$sliders.filter(element => element.getAttribute('name') === name)[0];
    return new DragContext({
      \$context,
      \$dragger,
      name,
      direction: 'horizontal',
      initX: 120
    });
  });

const name = \$picker.getAttribute('name');
const context = new DragContext({
  \$context: \$picker,
  \$dragger: \$indicator,
  name,
  direction: 'both'
});
```

<iframe width="100%" height="400" src="//jsfiddle.net/Nikaple/zhh8qv7x/10/embedded/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>



### 实现颜色预览

接下来我们需要通过当前游标的位置，确定当前各个变量的值。为此，我们重写valueOf()函数，为每一项都生成一个[0, 1]区间的值：

```javascript
class DragContext {
  ...
  valueOf() {
    switch (this.direction) {
      case 'horizontal':
        return this.name === 'alpha' ?
          this._x / this._rect.width :
          1 - this._x / this._rect.width;
      case 'vertical':
        return this._y / this._rect.height;
      case 'both':
        return [this._x / this._rect.width, 1 - this._y / this._rect.height];
    }
  }
}
```

由于`hue`的渐变是向左的，所以为了计算实际的`hue`值比例，应该使用`1 - this._x / this._rect.width`计算。

为了更方便地渲染`context`部分的样式，我们新建一个渲染类来完成这部分的工作：

```javascript
class DragContext {
  _setContextStyles() {
    StyleRenderer.getInstance().evaluate();
  }
}

class StyleRenderer {
  constructor(doms, contexts) {
    this.doms = doms;
    this.doms.preview = document.querySelector('.preview');
    this.doms.result = {
      hex: document.querySelector('.hex'),
      rgb: document.querySelector('.rgb'),
      hsl: document.querySelector('.hsl'),
    }
    this.contexts = contexts;
    this.evaluate();
  }

  evaluate() {
    // calculate color values
    console.log(this.doms, this.contexts);
    this.setStyles();
  }

  setStyles() {
    // set context styles
  }

  static getInstance(doms, contexts) {
    if (!this.instance) {
      this.instance = new StyleRenderer(doms, contexts);
    }
    return this.instance;
  }
}
```

当我们用`querySelector`获取节点，创建`DragContext`对象时，就可以将获取到的节点与对象缓存，然后在创建渲染器时传入。`StyleRenderer`类以单例模式创建，并在构造函数中获取其他未缓存的节点。接着调用`evaluate`函数确认颜色的值，最后使用`setStyles`为界面着色。为了缓存`dom`与`DragContext`对象，我们需要重写调用代码：

```javascript
const doms = {};
const dragContexts = [];
kickPicker();
kickSliders();
StyleRenderer.getInstance(doms, dragContexts);

function kickPicker() {
  // 获取色盘有关节点并缓存
  const \$picker = document.querySelector('.color-picker');
  const \$indicator = document.querySelector('.color-indicator');
  doms.\$picker = \$picker;
  doms.\$indicator = \$indicator;

  // 获取色盘有关对象并缓存
  const name = \$picker.getAttribute('name');
  const context = new DragContext({
    \$context: \$picker,
    \$dragger: \$indicator,
    name,
    direction: 'both'
  });
  dragContexts.push(context);
}

function kickSliders() {
  // 获取滑轮有关节点并缓存
  const \$palletes = Array.prototype.slice.call(document.querySelectorAll('.palette'));
  const \$sliders = Array.prototype.slice.call(document.querySelectorAll('.slider'));
  doms.\$palletes = \$palletes;
  doms.\$sliders = \$sliders;

  // 获取滑轮有关对象并缓存
  const contexts = \$palletes.map((\$context) => {
    const name = \$context.getAttribute('name');
    const \$dragger = \$sliders.filter(element => element.getAttribute('name') === name)[0];
    return new DragContext({
      \$context,
      \$dragger,
      name,
      direction: 'horizontal',
      initX: 120
    });
  });
  dragContexts.push(...contexts);
}
```

这时，从刚刚的`console.log`中可以看出，我们获取的节点与创建的`DragContext`都被缓存并传入`StyleRenderer`的实例中了。接下来可以着手实现`evaluate`函数了：

```javascript
class StyleRenderer {
  ...
  evaluate() {
    // 色相滑块获取色相
    this.hue = 360 * this.contexts
      .filter(context => context.getName() === 'hue')[0]
      .valueOf();
    // 色盘横纵坐标获取饱和度与明度，注意的颜色是基于hsb而不是hsl的
    [this.saturation, this.brightness] = this.contexts
      .filter(context => context.getName() === 'color')[0]
      .valueOf();
    // 透明度滑块获取透明度
    this.alpha = this.contexts
      .filter(context => context.getName() === 'alpha')[0]
      .valueOf();
    // 用三个工具函数分别计算出hsl, rgb, hex的值
    this.hsl = utils.color.hsb2hsl(this.hue, this.saturation, this.brightness);
    this.rgb = utils.color.hsl2rgb(this.hsl.h, this.hsl.s, this.hsl.l);
    this.hex = utils.color.rgb2hex(this.rgb.r, this.rgb.g, this.rgb.b);
    // 当hex值可以简化时，将#66ccff简化为#6cf
    const simplifyHex = /^#(?:([\\da-f])\1){3}\$/.exec(this.hex);
    if (simplifyHex !== null) {
      this.hex = `#\${this.hex[1]}\${this.hex[3]}\${this.hex[5]}`;
    }
    this.setStyles();
  }
}
```

当我们的`DragContext`类拥有了`valueOf`函数之后，获取颜色各个分量的值就是一个函数调用的事，接着就轮到`setStyles`了，有了它，我们就能完成`90%`了！

```javascript
class StyleRenderer {
  ...
  setStyles() {
    // set context styles
    const round = Math.round;
    const rgbValues = `\${round(this.rgb.r * 255)}, \${round(this.rgb.g * 255)}, \${round(this.rgb.b * 255)}`;
    const alphaValue = utils.trimZero(this.alpha.toFixed(2));
    const hslaColor = `hsla(\${round(this.hsl.h % 360)}, \${round(this.hsl.s * 100)}%, \${round(this.hsl.l * 100)}%, \${alphaValue})`;
    const rgbColor = `rgb(\${rgbValues})`;
    const rgbaColor = `rgba(\${rgbValues}, \${alphaValue})`
    // 如果用图片或者再加一个div来代替棋盘背景的话，这里的代码会好很多
    this.doms.preview.style.background =
      `linear-gradient(\${hslaColor}, \${hslaColor}) 0 0 / cover,
      linear-gradient(45deg, rgba(0,0,0,0.25) 25%, transparent 0, transparent 75%, rgba(0,0,0,0.25) 0) 0 0 / 12px 12px,
      linear-gradient(45deg, rgba(0,0,0,0.25) 25%, transparent 0, transparent 75%, rgba(0,0,0,0.25) 0) 6px 6px / 12px 12px`;
    this.doms.\$palletes
      .filter(element => element.getAttribute('name') === 'alpha')[0]
      .style.background =
        `linear-gradient(to right, rgba(0,0,0,0), \${rgbColor}) 0 0 / cover,
        linear-gradient(45deg, rgba(0,0,0,0.25) 25%, transparent 0, transparent 75%, rgba(0,0,0,0.25) 0) 0 0 / 12px 12px,
        linear-gradient(45deg, rgba(0,0,0,0.25) 25%, transparent 0, transparent 75%, rgba(0,0,0,0.25) 0) 6px 6px / 12px 12px`;
    this.doms.\$picker.style.backgroundColor = `hsl(\${this.hue}, 100%, 50%)`;

    // results
    this.doms.result.hex.innerHTML = this.hex;
    this.doms.result.rgb.innerHTML = `rgba(\${round(this.rgb.r * 255)}, \${round(this.rgb.g * 255)}, \${round(this.rgb.b * 255)}, \${utils.trimZero(this.alpha.toFixed(2))})`;
    this.doms.result.hsl.innerHTML = hslaColor;
  }
}
```

为了让我们的取色板更像取色板，当然要让它派上用场啦！不如就把那个白了一整个教程的`Change my color pls`的颜色改掉吧！为此，我们需要把`div.target`的节点也加入到我们`StyleRenderer`的实例中；更进一步，调色板一般是默认隐藏的，为此，我们可以修改`div.wrapper`的样式，并在鼠标点击时`toggle`它的`active`类：

```css
.wrapper {
  user-select: none;
  transition: all ease-in-out 0.2s;
  transform-origin: 50% 100%;
  transform: scale(0.8) rotate3d(0, 1, 0, 90deg);
}

.wrapper.active {
  transform: scale(1) rotate3d(0, 1, 0, 0);
}
```

```javascript
const doms = {};
const dragContexts = [];
kickTarget();
function kickTarget() {
  const \$target = document.querySelector('.target');
  doms.\$target = \$target;
  const \$colorPickerComponent = document.querySelector('.wrapper');
  utils.addHandler(\$target, 'click', (e) => {
    \$colorPickerComponent.classList.toggle('active');
  });
  // 在第一次点开取色板时再初始化
  utils.addHandler(\$colorPickerComponent, 'transitionend', function handler(){
    kickPicker();
    kickSliders();
    StyleRenderer.getInstance(doms, dragContexts);
    utils.removeHandler(\$colorPickerComponent, 'transitionend', handler);
  });
}
function kickPicker() {
  ...
}
function kickSliders() {
  ...
}
```

接着，在`StyleRenderer`中渲染文字颜色：

```javascript
class StyleRenderer {
  setStyles() {
    ...
    // target
    this.doms.$target.style.color = hslaColor;
  }
}
```

由于我们默认为字体颜色为白色，并且有`StyleRenderer`为我们设置背景，现在可以将`div.preview`中与`div.alpha`中的背景颜色改回来了：

```css
.preview {
  background: white;
}

.alpha {
   background:
     linear-gradient(to right, rgba(0,0,0,0), rgba(255,255,255,1)) 0 0 / cover,
     linear-gradient(45deg, rgba(0,0,0,.25) 25%, transparent 0, transparent 75%, rgba(0,0,0,.25) 0) 0 0 / 12px 12px,
     linear-gradient(45deg, rgba(0,0,0,.25) 25%, transparent 0, transparent 75%, rgba(0,0,0,.25) 0) 6px 6px / 12px 12px;
}
```

<iframe width="100%" height="400" src="//jsfiddle.net/Nikaple/zhh8qv7x/12/embedded/" allowfullscreen="allowfullscreen" frameborder="0"></iframe>



### 后记

在`Firefox`里测试的时候才发现，`max-content`这个值的兼容性有点令人捉急... 于是还是加个`fallback`吧...

```css
.target {
  width: 240px;
}
```

（完）







### 附录

##### Utils对象

```javascript
const utils = {
  // 事件绑定
  addHandler(target, event, handler) {
    if (target.addEventListener) {
      target.addEventListener(event, handler, false);
    } else if (target.attachEvent) {
      target.attachEvent('on' + event, handler);
    } else {
      target['on' + event] = handler;
    }
  },
  // 事件解绑
  removeHandler(target, event, handler) {
    if (target.removeEventListener) {
      target.removeEventListener(event, handler, false);
    } else if (target.detachEvent) {
      target.detachEvent('on' + event, handler);
    } else {
      target['on' + event] = null;
    }
  },
  // 坐标锁定
  clamp(val, min, max) {
    return val < min ? min : (val > max ? max : val);
  },
  // 判断是否为数组
  isArray(arrayLike) {
    return Object.prototype.toString.call(arrayLike) === '[object Array]';
  },
  // 数字末尾除0
  trimZero(str) {
    return str.replace(/\.?0*\$/, '');
  },
  color: {
    // https://gist.github.com/NV/522734
    // hsb颜色转为hsl颜色
    hsb2hsl(h, s, b) {
      var hsl = {
        h: h
      };
      hsl.l = (2 - s) * b;
      hsl.s = s * b;
      if (hsl.l <= 1 && hsl.l > 0) {
        hsl.s /= hsl.l;
      } else {
        hsl.s = hsl.s / (2 - hsl.l) || 0;
      }
      hsl.l /= 2;
      if (hsl.s > 1) {
        hsl.s = 1;
      }
      return hsl;
    },
    /**
     * Converts an HSL color value to RGB. Conversion formula
     * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
     * Assumes s and l are contained in the set [0, 1] and h is
     * contained in the set [0, 360], returns r, g, and b in the
     * set [0, 255].
     *
     * @param   {number}  h       The hue
     * @param   {number}  s       The saturation
     * @param   {number}  l       The lightness
     * @return  {Array}           The RGB representation
     */
    // hsl颜色转为rgb颜色
    hsl2rgb(h, s, l) {
      h = h / 360;
      var r, g, b;
      if (s == 0) {
        r = g = b = l; // achromatic
      } else {
        var hue2rgb = function hue2rgb(p, q, t) {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1 / 6) return p + (q - p) * 6 * t;
          if (t < 1 / 2) return q;
          if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
          return p;
        }
        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
      }
      return {r, g, b};
    },
    // rgb颜色转为hex颜色
    rgb2hex(r, g, b) {
      return "#" + (16777216 | (b * 255) | ((g * 255) << 8) | ((r * 255) << 16)).toString(16).slice(1);
    }
  }
}
```