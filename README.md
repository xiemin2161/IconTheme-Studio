# IconTheme Studio v1.0.1

`IconTheme Studio` 是一个从「图标生产」到「项目接入」的完整工具。  
你可以在本地维护 SVG 源文件，一键构建预览站，完成颜色变量绑定后导出离线包，再接入业务项目。

## 一次看懂完整流程

1. 准备 SVG 源图标，按命名规范放到 `icon/` 目录。
2. 执行构建命令，生成 `fonts/` 下的字体、symbol、预览页面和组件产物。
3. 打开预览页面检查图标并做颜色绑定（主色/辅色）。
4. 下载离线包（会按绑定规则写入变量）。
5. 在业务项目中引入离线包资源，按 `FontClass` / `Symbol` / `Unicode` 方式使用。
6. 在项目主题中只需控制两个变量：`--its-icon-primary`、`--its-icon-secondary`。

## 1) 图标文件命名与目录规范

图标源文件统一放在 `icon/` 目录，扩展名必须是 `.svg`。

命名规则：

- 基础命名：`iconName.svg`  
  示例：`language.svg`
- 带中文标签命名：`iconName·标签1·标签2.svg`  
  示例：`language·语言·多语言.svg`

说明：

- `iconName` 建议使用英文（会成为类名、symbol id、组件名的基础）。
- 标签分隔符是 `·`（中点），不是 `-`、`_` 或 `@`。
- 构建时会自动提取标签生成 `fonts/icon-tags.json`，并在构建结束后恢复原文件名。

## 2) 构建流程

先安装依赖，然后执行完整构建：

```bash
npm install
npm run build
```

构建完成后主要产物在 `fonts/`：

- `its-icon.css`、`its-icon.ttf/woff/woff2/eot`（FontClass/Unicode 资源）
- `its-icon.symbol.svg`（Symbol 资源）
- `its-icon.json`（字形映射）
- `index.html`（预览站）
- `app.js`、`download.js`、`help-content.js`（站点逻辑）

## 3) 主题色绑定流程

用静态服务打开预览页：

```bash
npx serve fonts
```

在页面中操作：

1. 点击右上角“颜色绑定”按钮。
2. 从颜色池里选颜色，分别绑定到主色和辅色。
3. 绑定后可点“主题切换”实时预览（仅对 Symbol 生效，会自动切到 Symbol 标签）。

绑定结果会持久化到浏览器本地存储，刷新后仍然保留。

## 4) 离线包导出与交付

推荐通过离线包进行交付与接入，流程更稳定、环境依赖更少。

点击右上角下载后得到：`icontheme-studio.zip`。

导出规则：

- 已绑定颜色再下载：导出包会把 SVG 颜色替换为 `var(--its-icon-primary/secondary)`，支持项目主题切换。
- 未绑定颜色下载：会提示这是固定色包，但仍允许继续下载。

## 5) 业务项目接入方式

把离线包资源放到项目静态目录，例如 `/assets/icons/`。

### 方式 A：FontClass（简单）

引入：

```html
<link rel="stylesheet" href="/assets/icons/its-icon.css" />
```

使用：

```html
<i class="its-icon-language"></i>
```

### 方式 B：Symbol（推荐，支持主题变量）

先把 `its-icon.symbol.svg` 注入页面（只做一次）：

```html
<script>
fetch('/assets/icons/its-icon.symbol.svg')
  .then(r => r.text())
  .then(svg => {
    const div = document.createElement('div');
    div.style.display = 'none';
    div.innerHTML = svg;
    document.body.prepend(div);
  });
</script>
```

再使用：

```html
<svg class="icon"><use href="#its-icon-language"></use></svg>
```

建议样式：

```css
.icon {
  width: 1em;
  height: 1em;
  fill: currentColor;
  vertical-align: -0.15em;
  overflow: hidden;
}
```

### 方式 C：Unicode

引入 `its-icon.css` 后可直接写：

```html
<i class="its-icon">&#xea0e;</i>
```

## 6) 项目主题色接管

如果你下载的是“已绑定变量”图标包，在业务项目里设置：

```css
:root {
  --its-icon-primary: #4caf50;
  --its-icon-secondary: #ffffff;
}
```

切换主题时仅改这两个变量即可，无需改每个图标。

## 目录说明

- `icon/`：SVG 源图标目录（你日常维护这里）。
- `fonts/`：构建产物与预览站点目录。
- `scripts/`：构建脚本和页面模板。
- `react/`：构建生成的 React 组件产物。

## 常用命令

- `npm run build`：完整构建（推荐日常使用，包含标签处理与恢复）。
- `npm run font`：仅重新生成字体及相关资源。
- `npm run create-js-files`：仅更新预览站脚本文件。

## 许可证

MIT
