# lvmama fix

Visual Studio Code 扩展插件，使用 [驴妈妈Eslint规则](https://github.com/LVMM-H5/front-end-style-guide/tree/master/eslint) 检查并自动修复代码中的问题。

[下载地址](https://marketplace.visualstudio.com/items?itemName=Sky.lvmama-fix)

## 工作流程

1. 检查代码是否存在解析（语法）错误
1. 自动格式化代码
1. 修复可以修复的全部问题

## 预览

原始代码：
```js
var a = 1;
a = 2
var b = {};
b(function(name){
··console.log(123);
})

if (true)
    this.test()
else
    this.test('a的值是：' + a)
```

lvmama fix 修复后：
```js
let a = 1;
a = 2;
const b = {};
b(name => {
····console.log(123);
});

if (true) { this.test(); } else { this.test(`a的值是：${a}`); }

```

## 使用

通过 `Ctrl+Shift+P` 打开命令面板，输入 `lvmama` 可以查看到2条修复命令：

* `lvmama fix: 修复当前文件`

    对当前激活状态编辑页面的代码进行 Eslint 检查，检查出的问题会显示在 `输出` 面板中，并自动修复全部可修复的问题。支持 `JavaScript`, `HTML`, `Vue` 文件类型。注意必须是已经保存的文件，使用 VSCode 新创建而未保存的文件不可用。

    你也可以点击编辑器右上角的 `小驴` 图标或者快键键 `Ctrl+L` 调用。

* `lvmama fix: 修复指定目录下所有文件`

    通过键入一个目录路径，对该目录下所有 `.js`, `.htm`, `.html`, `.vue` 后缀的文件进行 Eslint 检查，检查出的问题会显示在 `输出` 面板中，并自动修复全部可修复的问题。输入的目录支持相对路径和绝对路径。查找文件时会自动过滤任意层级的 `node_modules` 目录。

## 更新日志

### 1.0.0

* lvmama fix 初始版本发布。

### 1.1.0

* 更新 eslint-config-lvmama 至 v1.1.3，新增了 `no-escape` 自定义规则。

### 1.1.1

* 使用 `lvmama fix: 修复指定目录下所有文件` 命令现在会自动排除 `node_modules` 目录了。

### 1.1.2

* 忽略本地目录下的 `.eslintrc` 文件。

### 1.1.3

* 增加 Eslint 环境定义。

### 1.1.4

* 新增 `no-tab-use` 自定义规则（含自动修复）。

### 1.2.0

* 同步最新 `eslint-config-lvmama` 规则；
* 在 Eslint 自动修复之前，现在会自动进行一次代码格式化操作；
* 相关逻辑优化。

### 1.2.1

* 更改插件 logo；
* 在编辑器右上角添加 `小驴` 图标按钮，关联 `修复当前文件` 指令；
* 移除右键菜单的 `修复当前文件` 项。