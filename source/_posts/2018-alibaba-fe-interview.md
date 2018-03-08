---
title: 2018阿里前端面试题两道
date: 2017-08-23 12:08:07
tags: [JavaScript, 面试]
---
今年秋招阿里前端的笔试大题部分总得来说不难，大题也只有两道，只不过时间会有点紧。
#### 第一题 - 当 json 中有环时，JSON.stringify(json) 会报错。写一个函数判断 obj 是否有环。
<!-- more -->
```javascript
// 递归实现
const detectCycle = (function () {
  const objs = [];
  return function baseDetect(obj) {
    for (const prop in obj) {
      if (typeof obj[prop] === 'object') {
        if (objs.indexOf(obj[prop]) !== -1) {
          return true;
        } else {
          objs.push(obj[prop]);
          return baseDetect(obj[prop]);
        }
      }
    }
    return false;
  }
})();

// 或者来个更粗暴的
const detectCircular = function(obj) {
  try {
    JSON.stringify(obj);
    return false;
  } catch (e) {
    return true;
  }
}
```

首先在闭包中使用一个数组保存遍历遇到的所有 `obj`，每次遇到 `object `类型的值时，就与该数组中已有 `obj `进行比较，如果在已有数组中查询到了当前 `obj`，那么便存在环。

之后我们用`console`自带的`assert`函数测试一下：

```javascript
let obj1 = {};
console.assert(detectCircular(obj1) === false, 'object1 should not be circular.');

let obj2 = {
  foo: 1,
  bar: ['b', 'a', 'z'],
  baz: function() {}
};
console.assert(detectCircular(obj2) === false, 'object2 should not be circular.');

let obj3 = {};
obj3.foo = obj3;
console.assert(detectCircular(obj3) === true, 'object3 should be circular.');

let obj4 = {
  foo: {
    bar: null
  }
};
obj4.foo.bar = obj4;
console.assert(detectCircular(obj4) === true, 'object4 should be circular.');

let obj5 = {
  foo: {
    bar: {
      baz: null
    }
  }
};
obj5.foo.bar.baz = obj5.foo;
console.assert(detectCircular(obj5) === true, 'object5 should be circular.');

let obj6 = {
  foo: {
    baz: null
  },
  bar: {
    baz: null
  }
}
obj6.foo.baz = obj6.bar;
obj6.bar.baz = obj6.foo;
console.assert(detectCircular(obj6) === true, 'object6 should be circular.');

let obj7 = {
  foo: {
    bar: 'baz'
  }
};
let obj8 = {
  foo: obj7
}
obj7.foo.bar = obj8.foo;
console.assert(detectCircular(obj7) === true, 'object7 should be circular.');
```



#### 第二题 - 利用面向对象的思想实现一个表格渲染组件。数据如下：

```javascript
const columns = [
  { text: 'Name', key: 'name' },
  { text: 'Age', key: 'age' },
  { text: 'Gender', key: 'gender' }
];

const data = [
  { name: 'Tom', age: 5, gender: 1 },
  { name: 'Jerry', age: 2, gender: 0 },
];
```

要求：
  1. 将 columns 渲染到表头；
  2. 将 data 里对应的数据与表头对齐，绘制到表格体中；
  3. 将 gender 属性的 0 替换为 'Male'，1 替换为 'Female'。



这道题还算比较简单，在这里定义了一个 FormRenderer 类，里面主要定义了 `renderTableHead`, `renderTableBody` , `renderTableCell` 与 `renderAll` 四个方法，分别用于渲染表头，表身，单元格以及整个表格。ableBody现如下：

```javascript
class FormRenderer {
  constructor(selector, columns, data, fn) {
    this.$table = document.querySelector(selector);
    this.head = columns;
    this.data = data;
    this.transform(fn);
    this.init();
  }

  init() {
    this.headKey = this.head.map(obj => obj.key);
    this.renderAll();
  }

  renderTableHead() {
    const $container = document.createElement('tr');
    this.head.forEach(head => {
      this.renderTableCell($container, 'th', head.text);
    });
    return $container;
  }

  renderTableBody() {
    const $body = [];
    this.data.forEach(data => {
      const $container = document.createElement('tr');
      this.headKey.forEach(key => {
        for (const prop in data) {
          if (prop === key) {
            this.renderTableCell($container, 'th', data[prop])
            $body.push($container);
            break;
          }
        }
      })
    });
    return $body;
  }

  renderTableCell(container, type, data) {
    const $td = document.createElement(type);
    const $text = document.createTextNode(data);
    $td.appendChild($text);
    container.appendChild($td);
  }

  renderAll() {
    const $container = document.createDocumentFragment();
    const $head = this.renderTableHead();
    const $body = this.renderTableBody();
    $container.appendChild($head);
    $body.forEach($row => {
      $container.appendChild($row);
    });
    this.$table.appendChild($container);
  }

  transform(fn) {
    this.data.forEach(fn);
  }
}

const transformer = function (obj) {
  if (obj.gender === 0) {
    obj.gender = 'Female';
  } else {
    obj.gender = 'Male';
  }
}

const renderer = new FormRenderer('#table', columns, data, transformer);
```

这里的 transformer 功能相当于 Angular 4 的 Pipe，在这次笔试中我为了达到目的，传了一个对 data 数组中每一项数据的处理函数进去，实际上这部分还能继续拓展。