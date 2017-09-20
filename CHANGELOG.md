# 更新日志

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
* 在编辑器右上角添加 <img width="25px" height="25px" src="https://github.com/LVMM-H5/lvmama-fix/blob/master/images/dark.png"> 图标按钮，关联 `修复当前文件` 指令；
* 移除右键菜单的 `修复当前文件` 项。
