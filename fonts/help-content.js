// 帮助内容管理 - 统一数据源（自动生成）
var helpContentData = null;

// 统一的帮助内容数据（在线版和离线版都使用这份数据）
var HELP_CONTENT_DATA = {
  "fontclass": {
    "html": {
      "sections": [
        { "title": "第 1 步：准备资源（放进你的项目）", "code": "把这些文件放到你项目可访问的静态资源目录中（例如 /assets/icons/）：\nits-icon.css\nits-icon.woff2（推荐）\nits-icon.woff（可选）\nits-icon.ttf（可选）\nits-icon.eot（兼容 IE 才需要）\n\n这些文件可以从本仓库的 fonts/ 目录获取。" },
        { "title": "第 2 步：确保 CSS 能找到字体文件", "code": "its-icon.css 里通过 url(...) 引用字体文件：\n- 最省事：让 its-icon.css 和字体文件放在同一目录\n- 否则：按你的构建/发布路径调整 its-icon.css 内的 url(...) 指向" },
        { "title": "第 3 步：在页面/入口引入 CSS", "code": "<link rel=\"stylesheet\" href=\"/assets/icons/its-icon.css\">" },
        { "title": "第 4 步：写一个图标（推荐写法）", "code": "<i class=\"its-icon-language\"></i>" },
        { "title": "第 5 步：调大小/颜色", "code": "<i class=\"its-icon-language\" style=\"font-size:24px;color:#1890ff;\"></i>" },
        { "title": "常见坑", "code": "1) its-icon.css 里使用相对路径引用字体文件：CSS 和字体文件要放在同一目录\n2) 本地双击 file:// 预览没问题，但实际项目请用服务器路径/打包资源路径" }
      ],
      "note": "这是最推荐的方式：直接用 class 即可。点击页面任意图标会复制代码。"
    },
    "react": [
      { "title": "第 1 步：安装", "code": "npm i icontheme-studio" },
      { "title": "第 2 步：导入并使用", "code": "import { Language } from \"icontheme-studio\";\n\nexport default function App() {\n  return <Language />;\n}" },
      { "title": "第 3 步：设置大小/颜色（就是 style）", "code": "<Language style={{ fontSize: 24, color: '#1890ff' }} />" },
      { "title": "常见坑", "code": "如果你想用 FontClass（<i class=...>）方式，请引入 its-icon.css；用 React 组件方式则不需要手动写 <i>。" }
    ],
    "vue": [
      { "title": "第 1 步：安装", "code": "npm i icontheme-studio-vue" },
      { "title": "第 2 步：按需导入（推荐）", "code": "<template>\n  <Language :style=\"{ fontSize: '24px', color: '#1890ff' }\" />\n</template>\n\n<script setup>\nimport { Language } from 'icontheme-studio-vue';\n</script>" },
      { "title": "第 3 步：全局注册（图标很多时用）", "code": "// main.ts\nimport { createApp } from 'vue';\nimport * as icons from 'icontheme-studio-vue';\n\nconst app = createApp(App);\nObject.keys(icons).forEach((k) => app.component(k, icons[k]));\napp.mount('#app');" },
      { "title": "常见坑", "code": "组件名是 PascalCase（例如 Language），不要写成 <language>。" }
    ],
    "angular": [
      { "title": "第 1 步：安装", "code": "npm i icontheme-studio-angular" },
      { "title": "第 2 步：导入模块", "code": "// app.module.ts\nimport { IconsModule } from 'icontheme-studio-angular';\n\n@NgModule({\n  imports: [IconsModule],\n})\nexport class AppModule {}" },
      { "title": "第 3 步：模板里使用", "code": "<its-icon-language [style]=\"{ fontSize: '24px', color: '#1890ff' }\"></its-icon-language>" },
      { "title": "常见坑", "code": "如果你用到了按需导入（xxxModule），记得只在对应 feature module 里引入。" }
    ]
  },
  "symbol": {
    "html": [
      { "title": "第 1 步：准备资源（放进你的项目）", "code": "把 its-icon.symbol.svg 放到你项目可访问的静态资源目录中（例如 /assets/icons/）。\n\n文件可从本仓库 fonts/ 目录获取。" },
      { "title": "第 2 步：把 symbol 注入到页面（只需要做一次）", "code": "<script>\nfetch('/assets/icons/its-icon.symbol.svg')\n  .then(r => r.text())\n  .then(svg => {\n    const div = document.createElement('div');\n    div.style.display = 'none';\n    div.innerHTML = svg;\n    document.body.prepend(div);\n  });\n</script>" },
      { "title": "第 3 步：使用图标", "code": "<svg class=\"icon\"><use xlink:href=\"#its-icon-language\"></use></svg>" },
      { "title": "第 4 步：统一样式（推荐）", "code": ".icon{width:1em;height:1em;fill:currentColor;vertical-align:-0.15em;overflow:hidden}" },
      { "title": "常见坑", "code": "必须先把 svg 内容注入到 DOM（或用构建工具内联），否则 <use> 找不到图标。" }
    ],
    "react": [
      { "title": "第 1 步：安装", "code": "npm i icontheme-studio" },
      { "title": "第 2 步：准备资源（放进你的项目）", "code": "从 node_modules/icontheme-studio 或本仓库 fonts/ 中找到 its-icon.symbol.svg，放到你项目可访问的静态资源目录中（例如 /assets/icons/）。" },
      { "title": "第 3 步：把 symbol 注入到页面（只需要做一次）", "code": "// 例如在 index.html 或 App 入口执行一次\nfetch('/assets/icons/its-icon.symbol.svg')\n  .then((r) => r.text())\n  .then((svg) => {\n    const div = document.createElement('div');\n    div.style.display = 'none';\n    div.innerHTML = svg;\n    document.body.prepend(div);\n  });" },
      { "title": "第 4 步：写一个通用组件", "code": "export const Icon = ({ name, ...props }) => (\n  <svg {...props}>\n    <use xlinkHref={'#its-icon-' + name} />\n  </svg>\n);" },
      { "title": "第 5 步：使用", "code": "<Icon name=\"language\" style={{ width: 24, height: 24, fill: '#1890ff' }} />" },
      { "title": "常见坑", "code": "同 HTML：要先注入 its-icon.symbol.svg（或在构建时内联），否则渲染为空。" }
    ],
    "vue": [
      { "title": "第 1 步：安装", "code": "npm i icontheme-studio-vue" },
      { "title": "第 2 步：准备资源（放进你的项目）", "code": "把 its-icon.symbol.svg 放到你项目可访问的静态资源目录中（例如 /assets/icons/）。\n\n文件可从本仓库 fonts/ 目录获取。" },
      { "title": "第 3 步：把 symbol 注入到页面（只需要做一次）", "code": "// 例如在 main.ts 执行一次\nfetch('/assets/icons/its-icon.symbol.svg')\n  .then((r) => r.text())\n  .then((svg) => {\n    const div = document.createElement('div');\n    div.style.display = 'none';\n    div.innerHTML = svg;\n    document.body.prepend(div);\n  });" },
      { "title": "第 4 步：写一个通用组件（Vue3）", "code": "<template>\n  <svg v-bind=\"$attrs\"><use :xlink:href=\"'#its-icon-' + name\" /></svg>\n</template>\n\n<script setup>\ndefineProps({ name: { type: String, required: true } });\n</script>" },
      { "title": "第 5 步：使用", "code": "<Icon name=\"language\" :style=\"{ width: '24px', height: '24px', fill: '#1890ff' }\" />" },
      { "title": "常见坑", "code": "要先注入 its-icon.symbol.svg（或在构建时内联），否则 <use> 找不到图标。" }
    ],
    "angular": [
      { "title": "第 1 步：安装", "code": "npm i icontheme-studio-angular" },
      { "title": "第 2 步：准备资源（放进你的项目）", "code": "从 node_modules/icontheme-studio-angular 或本仓库 fonts/ 中找到 its-icon.symbol.svg，放到你项目可访问的静态资源目录中（例如 /assets/icons/）。" },
      { "title": "第 3 步：把 symbol 注入到页面（只需要做一次）", "code": "// 例如在 main.ts 或 AppComponent 初始化时执行一次\nfetch('/assets/icons/its-icon.symbol.svg')\n  .then((r) => r.text())\n  .then((svg) => {\n    const div = document.createElement('div');\n    div.style.display = 'none';\n    div.innerHTML = svg;\n    document.body.prepend(div);\n  });" },
      { "title": "第 4 步：模板里使用（最简单）", "code": "<svg style=\"width:24px;height:24px;fill:#1890ff\">\n  <use xlink:href=\"#its-icon-language\"></use>\n</svg>" },
      { "title": "常见坑", "code": "同 HTML：必须先注入 its-icon.symbol.svg，否则 <use> 找不到。" }
    ]
  },
  "unicode": {
    "html": {
      "sections": [
        { "title": "第 1 步：准备资源（放进你的项目）", "code": "把这些文件放到你项目可访问的静态资源目录中（例如 /assets/icons/）：\nits-icon.css + 字体文件（woff2/woff/ttf...）\n\n这些文件可以从本仓库 fonts/ 目录获取，或者通过安装 icontheme-studio 后从包内拷贝。" },
        { "title": "第 2 步：引入 CSS", "code": "<link rel=\"stylesheet\" href=\"/assets/icons/its-icon.css\">" },
        { "title": "第 3 步：写 Unicode（从列表里复制）", "code": "<i class=\"its-icon\">&#xe000;</i>" },
        { "title": "第 4 步：调大小/颜色", "code": "<i class=\"its-icon\" style=\"font-size:24px;color:#1890ff\">&#xe000;</i>" },
        { "title": "常见坑", "code": "Unicode 方式不需要 its-icon-xxx class，但必须有 its-icon 这个基础 class 才能用对字体。" }
      ],
      "note": "适合你要“直接用编码”的场景。点击列表里的 Unicode 可直接复制。"
    },
    "react": [
      { "title": "第 1 步：安装", "code": "npm i icontheme-studio" },
      { "title": "第 2 步：准备资源（放进你的项目）", "code": "从 node_modules/icontheme-studio 或本仓库 fonts/ 中找到 its-icon.css + 字体文件，放到你项目可访问的静态资源目录中（例如 /assets/icons/），并确保 CSS 内 url(...) 能正确指向字体文件。" },
      { "title": "第 3 步：写一个小组件", "code": "export const UnicodeIcon = ({ code, ...props }) => (\n  <i className=\"its-icon\" {...props}>\n    {String.fromCharCode(parseInt(code, 16))}\n  </i>\n);" },
      { "title": "第 4 步：使用", "code": "<UnicodeIcon code=\"e000\" style={{ fontSize: 24, color: '#1890ff' }} />" },
      { "title": "常见坑", "code": "别忘了引入 its-icon.css（否则只是普通文字）。" }
    ],
    "vue": [
      { "title": "第 1 步：安装", "code": "npm i icontheme-studio-vue" },
      { "title": "第 2 步：准备资源（放进你的项目）", "code": "从 node_modules/icontheme-studio-vue 或本仓库 fonts/ 中找到 its-icon.css + 字体文件，放到你项目可访问的静态资源目录中（例如 /assets/icons/），并确保 CSS 内 url(...) 能正确指向字体文件。" },
      { "title": "第 3 步：写一个组件（Vue3）", "code": "<template>\n  <i class=\"its-icon\" v-bind=\"$attrs\">{{ char }}</i>\n</template>\n\n<script setup>\nimport { computed } from 'vue';\nconst props = defineProps({ code: { type: String, required: true } });\nconst char = computed(() => String.fromCharCode(parseInt(props.code, 16)));\n</script>" },
      { "title": "第 4 步：使用", "code": "<UnicodeIcon code=\"e000\" :style=\"{ fontSize: '24px', color: '#1890ff' }\" />" }
    ],
    "angular": [
      { "title": "第 1 步：安装", "code": "npm i icontheme-studio-angular" },
      { "title": "第 2 步：准备资源（放进你的项目）", "code": "从 node_modules/icontheme-studio-angular 或本仓库 fonts/ 中找到 its-icon.css + 字体文件，放到你项目可访问的静态资源目录中（例如 /assets/icons/），并确保 CSS 内 url(...) 能正确指向字体文件。" },
      { "title": "第 3 步：模板里直接写", "code": "<i class=\"its-icon\" style=\"font-size:24px;color:#1890ff\">&#xe000;</i>" },
      { "title": "常见坑", "code": "同 HTML：一定要引入 its-icon.css（否则就是普通字符）。" }
    ]
  }
};

function getEmbeddedHelpContent() {
  return HELP_CONTENT_DATA;
}

function loadHelpContentData() {
  if (helpContentData) return Promise.resolve(helpContentData);
  helpContentData = HELP_CONTENT_DATA;
  return Promise.resolve(helpContentData);
}

function renderHelpSection(sections, note) {
  var html = '';
  if (sections) {
    sections.forEach(function(section) {
      html += '<h3>' + section.title + '</h3>';
      if (section.note) html += '<p class="note">' + section.note + '</p>';
      if (section.code) html += '<pre><code>' + escapeHtml(section.code) + '</code></pre>';
    });
  }
  if (note) html += '<p class="note">' + note + '</p>';
  return html;
}

function escapeHtml(text) {
  var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

function updateHelpContent() {
  var helpContent = document.getElementById('help-content');
  if (!helpContent) return;
  loadHelpContentData().then(function(data) {
    var content = '';
    try {
      if (currentTab === 'fontclass') {
        if (currentFramework === 'html') {
          var htmlData = data.fontclass.html;
          content = renderHelpSection(htmlData.sections, htmlData.note);
        } else if (currentFramework === 'react') {
          content = renderHelpSection(data.fontclass.react);
        } else if (currentFramework === 'vue') {
          content = renderHelpSection(data.fontclass.vue);
        } else if (currentFramework === 'angular') {
          content = renderHelpSection(data.fontclass.angular);
        }
      } else if (currentTab === 'symbol') {
        if (currentFramework === 'html') {
          content = renderHelpSection(data.symbol.html);
        } else if (currentFramework === 'react') {
          content = renderHelpSection(data.symbol.react);
        } else if (currentFramework === 'vue') {
          content = renderHelpSection(data.symbol.vue);
        } else if (currentFramework === 'angular') {
          content = renderHelpSection(data.symbol.angular);
        }
      } else if (currentTab === 'unicode') {
        if (currentFramework === 'html') {
          var unicodeData = data.unicode.html;
          content = renderHelpSection(unicodeData.sections, unicodeData.note);
        } else if (currentFramework === 'react') {
          content = renderHelpSection(data.unicode.react);
        } else if (currentFramework === 'vue') {
          content = renderHelpSection(data.unicode.vue);
        } else if (currentFramework === 'angular') {
          content = renderHelpSection(data.unicode.angular);
        }
      }
      if (!content) content = '<p>暂无该组合的使用说明。</p>';
    } catch (error) {
      console.error('Error rendering help content:', error);
      content = '<p>加载帮助内容时出错。</p>';
    }
    helpContent.innerHTML = content;
    highlightCode();
    addCopyButtons();
  });
}