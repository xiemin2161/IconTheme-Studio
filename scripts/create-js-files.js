const fs = require('fs');
const path = require('path');

// 创建额外的JS文件
function createAdditionalJSFiles() {
  const fontsDir = path.join(__dirname, '../fonts');
  
  // 创建完整的help-content.js
  const helpContentJS = createHelpContentJS();
  fs.writeFileSync(path.join(fontsDir, 'help-content.js'), helpContentJS);

  // app.js 以 fonts/app.js 为唯一源文件，构建时不覆盖，直接保留
  const appJSSrc = path.join(fontsDir, 'app.js');
  if (!fs.existsSync(appJSSrc)) {
    // 仅在文件不存在时才用内置模板生成（首次初始化）
    fs.writeFileSync(appJSSrc, createAppJS());
    console.log('✅ 初始化生成 app.js（首次）');
  } else {
    console.log('✅ app.js 已存在，跳过覆盖（保留自定义修改）');
  }
  
  console.log('✅ 创建了额外的JS文件: help-content.js');
}

function createHelpContentJS() {
  const helpContentJsonPath = path.join(__dirname, '../fonts/help-content.json');
  const helpContentJsPath = path.join(__dirname, '../fonts/help-content.js');

  if (fs.existsSync(helpContentJsonPath)) {
    console.log('✅ 从JSON文件生成内嵌数据版本的help-content.js');
    const jsonData = fs.readFileSync(helpContentJsonPath, 'utf8');
    return createEmbeddedHelpContentJS(jsonData);
  }

  if (!fs.existsSync(helpContentJsPath)) {
    throw new Error('缺少 fonts/help-content.json 或 fonts/help-content.js，无法生成帮助内容');
  }
  console.log('✅ 使用 fonts/help-content.js 作为帮助内容源');
  return fs.readFileSync(helpContentJsPath, 'utf8');
}

function createEmbeddedHelpContentJS(jsonData) {
  // 解析JSON并重新stringify以确保正确转义
  const parsedData = JSON.parse(jsonData);
  // 使用JSON.stringify，然后替换反引号和${}以避免模板字符串问题
  let safeJsonString = JSON.stringify(parsedData, null, 2);
  
  // 转义反引号和模板字符串语法，避免在JavaScript中被解释
  safeJsonString = safeJsonString
    .replace(/`/g, '\\`')           // 转义反引号
    .replace(/\$\{/g, '\\${');      // 转义 ${
  
  return `// 帮助内容管理 - 内嵌数据版本（自动生成）
var helpContentData = null;

// 内嵌的帮助内容数据（从JSON文件生成）
function getEmbeddedHelpContent() {
  return ${safeJsonString};
}

// 加载帮助内容数据
function loadHelpContentData() {
  if (helpContentData) {
    return Promise.resolve(helpContentData);
  }
  
  // 优先尝试从JSON文件加载（在线版本）
  if (window.location.protocol !== 'file:') {
    return fetch('help-content.json')
      .then(function(response) {
        if (!response.ok) {
          throw new Error('Failed to load help content');
        }
        return response.json();
      })
      .then(function(data) {
        helpContentData = data;
        return data;
      })
      .catch(function(error) {
        console.log('使用内嵌帮助内容（JSON加载失败）');
        helpContentData = getEmbeddedHelpContent();
        return helpContentData;
      });
  }
  
  // 离线版本直接使用内嵌数据
  helpContentData = getEmbeddedHelpContent();
  return Promise.resolve(helpContentData);
}

// 渲染帮助内容
function renderHelpSection(sections, note) {
  var html = '';
  
  if (sections) {
    sections.forEach(function(section) {
      html += '<h3>' + section.title + '</h3>';
      if (section.note) {
        html += '<p>' + section.note + '</p>';
      }
      if (section.code) {
        html += '<pre><code>' + escapeHtml(section.code) + '</code></pre>';
      }
    });
  }
  
  if (note) {
    html += '<p>' + note + '</p>';
  }
  
  return html;
}

// HTML转义
function escapeHtml(text) {
  var map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// 更新帮助内容
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
      
      // 如果没有找到内容，显示基本信息
      if (!content) {
        content = '<p>暂无该组合的使用说明。</p>';
      }
      
    } catch (error) {
      console.error('Error rendering help content:', error);
      content = '<p>加载帮助内容时出错。</p>';
    }
    
    helpContent.innerHTML = content;
    highlightCode();
    addCopyButtons();
  });
}`;
}

function createBasicHelpContent() {
  return `// 帮助内容管理
function updateHelpContent() {
  var helpContent = document.getElementById('help-content');
  var content = '';
  
  // 检测是否为下载版本（没有下载按钮表示是下载版）
  var isOfflineVersion = !document.getElementById('download-btn');
  
  if (currentTab === 'fontclass') {
    if (currentFramework === 'html') {
      content = getHtmlFontClassContent();
    } else if (currentFramework === 'react') {
      content = getReactFontClassContent(isOfflineVersion);
    } else if (currentFramework === 'vue') {
      content = getVueFontClassContent(isOfflineVersion);
    } else if (currentFramework === 'angular') {
      content = getAngularFontClassContent(isOfflineVersion);
    }
  } else if (currentTab === 'symbol') {
    if (currentFramework === 'html') {
      content = getHtmlSymbolContent(isOfflineVersion);
    } else if (currentFramework === 'react') {
      content = getReactSymbolContent();
    } else if (currentFramework === 'vue') {
      content = getVueSymbolContent(isOfflineVersion);
    } else if (currentFramework === 'angular') {
      content = getAngularSymbolContent(isOfflineVersion);
    }
  } else if (currentTab === 'unicode') {
    if (currentFramework === 'html') {
      content = getHtmlUnicodeContent();
    } else if (currentFramework === 'react') {
      content = getReactUnicodeContent();
    } else if (currentFramework === 'vue') {
      content = getVueUnicodeContent();
    } else if (currentFramework === 'angular') {
      content = getAngularUnicodeContent();
    }
  }
  
  helpContent.innerHTML = content;
  highlightCode();
  addCopyButtons();
}

// 基础帮助内容函数
function getHtmlFontClassContent() {
  return '<h3>引入样式文件</h3><pre><code>&lt;link rel="stylesheet" href="its-icon.css"&gt;</code></pre><h3>使用图标</h3><pre><code>&lt;i class="its-icon-language"&gt;&lt;/i&gt;</code></pre><p>点击任意图标即可复制对应的HTML代码。</p>';
}

// 占位符函数 - 需要手动实现完整版本
function getReactFontClassContent(isOfflineVersion) { return '<p>React帮助内容</p>'; }
function getVueFontClassContent(isOfflineVersion) { return '<p>Vue帮助内容</p>'; }
function getAngularFontClassContent(isOfflineVersion) { return '<p>Angular帮助内容</p>'; }
function getHtmlSymbolContent(isOfflineVersion) { return '<p>HTML Symbol帮助内容</p>'; }
function getReactSymbolContent() { return '<p>React Symbol帮助内容</p>'; }
function getVueSymbolContent(isOfflineVersion) { return '<p>Vue Symbol帮助内容</p>'; }
function getAngularSymbolContent(isOfflineVersion) { return '<p>Angular Symbol帮助内容</p>'; }
function getHtmlUnicodeContent() { return '<p>HTML Unicode帮助内容</p>'; }
function getReactUnicodeContent() { return '<p>React Unicode帮助内容</p>'; }
function getVueUnicodeContent() { return '<p>Vue Unicode帮助内容</p>'; }
function getAngularUnicodeContent() { return '<p>Angular Unicode帮助内容</p>'; }`;
}

function createAppJS() {
  return `// 主应用逻辑
var STORAGE_KEY_TAB = 'iconthemestudio:tab';
var STORAGE_KEY_FRAMEWORK = 'iconthemestudio:framework';
var VALID_TABS = { fontclass: true, symbol: true, unicode: true };
var VALID_FRAMEWORKS = { html: true, react: true, vue: true, angular: true };

function safeGetStorageItem(key) {
  try {
    return window && window.localStorage ? window.localStorage.getItem(key) : null;
  } catch (e) {
    return null;
  }
}

function safeSetStorageItem(key, value) {
  try {
    if (window && window.localStorage) window.localStorage.setItem(key, value);
  } catch (e) {}
}

var currentTab = (function() {
  var saved = safeGetStorageItem(STORAGE_KEY_TAB);
  return saved && VALID_TABS[saved] ? saved : 'fontclass';
})();
var currentFramework = 'html';

// 搜索与数据缓存
var allIconNames = [];
var unicodeMapCache = {};
var lastSearchTerm = '';
var searchDebounceTimer = null;

function setActiveTab(tabName, tabs, tabContents) {
  if (!tabName || !VALID_TABS[tabName]) tabName = 'fontclass';
  if (!tabs) tabs = document.querySelectorAll('.nav-tabs a');
  if (!tabContents) tabContents = document.querySelectorAll('.tab-content');

  tabs.forEach(function(t) {
    var isActive = t.getAttribute('data-tab') === tabName;
    t.classList.toggle('active', isActive);
  });
  tabContents.forEach(function(content) { content.classList.remove('active'); });
  var activeList = document.getElementById('icons-list-' + tabName);
  if (activeList) activeList.classList.add('active');
  currentTab = tabName;
  safeSetStorageItem(STORAGE_KEY_TAB, tabName);
  try {
    if (document && document.documentElement) {
      document.documentElement.setAttribute('data-its-tab', tabName);
    }
  } catch (e) {}
  if (typeof updateHelpContent === 'function') updateHelpContent();
}

// 初始化标签页切换
function initTabs() {
  var tabs = document.querySelectorAll('.nav-tabs a');
  var tabContents = document.querySelectorAll('.tab-content');
  
  // 初始化时按上次选择恢复
  setActiveTab(currentTab, tabs, tabContents);

  tabs.forEach(function(tab) {
    tab.onclick = function(e) {
      e.preventDefault();
      var tabName = this.getAttribute('data-tab');
      setActiveTab(tabName, tabs, tabContents);
    };
  });
}

// 初始化框架标签页切换
function initFrameworkTabs() {
  var frameworkTabs = document.querySelectorAll('.help-tab-btn');
  
  // 初始化时按上次选择恢复（若需要）
  var savedFramework = safeGetStorageItem(STORAGE_KEY_FRAMEWORK);
  if (savedFramework && VALID_FRAMEWORKS[savedFramework]) {
    currentFramework = savedFramework;
    frameworkTabs.forEach(function(t) {
      t.classList.toggle('active', t.getAttribute('data-framework') === savedFramework);
    });
    if (typeof updateHelpContent === 'function') updateHelpContent();
  }

  frameworkTabs.forEach(function(tab) {
    tab.onclick = function(e) {
      e.preventDefault();
      var framework = this.getAttribute('data-framework');
      frameworkTabs.forEach(function(t) { t.classList.remove('active'); });
      this.classList.add('active');
      currentFramework = framework;
      safeSetStorageItem(STORAGE_KEY_FRAMEWORK, framework);
      if (typeof updateHelpContent === 'function') {
        updateHelpContent();
      }
    };
  });
}

// 辅助函数
function showErrorMessage() {
  var errorMsg = document.createElement('div');
  errorMsg.style.cssText = 'position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #ff4444; color: white; padding: 15px 20px; border-radius: 5px; z-index: 9999; font-family: Arial, sans-serif;';
  errorMsg.innerHTML = '⚠️ 无法加载图标数据。请使用本地服务器运行此文件，或者检查文件是否完整。<br><small>双击HTML文件可能会遇到浏览器安全限制。</small>';
  document.body.appendChild(errorMsg);
  
  setTimeout(function() {
    if (errorMsg.parentNode) {
      errorMsg.parentNode.removeChild(errorMsg);
    }
  }, 8000);
}

function insertSvgContent(svgContent) {
  var div = document.createElement('div');
  div.style.display = 'none';
  div.innerHTML = svgContent;
  document.body.insertBefore(div, document.body.firstChild);
}

function parseUnicodeMap(cssContent) {
  var unicodeMap = {};
  var regex = /\\.its-icon-([^:]+):before\\s*\\{\\s*content:\\s*"\\\\([^"]+)"/g;
  var match;
  while ((match = regex.exec(cssContent)) !== null) {
    unicodeMap[match[1]] = match[2];
  }
  return unicodeMap;
}

function groupIconsByLetter(iconData) {
  var groupedIcons = {};
  var sortedIconNames = Object.keys(iconData).sort();
  
  sortedIconNames.forEach(function(iconName) {
    var firstLetter = iconName.charAt(0).toUpperCase();
    if (!groupedIcons[firstLetter]) {
      groupedIcons[firstLetter] = [];
    }
    groupedIcons[firstLetter].push(iconName);
  });
  
  return groupedIcons;
}

function clearElement(el) {
  if (!el) return;
  while (el.firstChild) el.removeChild(el.firstChild);
}

function groupIconNamesByLetter(iconNames) {
  var groupedIcons = {};
  var names = (iconNames || []).slice().sort();
  names.forEach(function(iconName) {
    var firstLetter = iconName.charAt(0).toUpperCase();
    if (!groupedIcons[firstLetter]) groupedIcons[firstLetter] = [];
    groupedIcons[firstLetter].push(iconName);
  });
  return groupedIcons;
}

function renderNoResults(listEl, term) {
  var li = document.createElement('li');
  li.className = 'no-results';
  li.textContent = term ? ('没有找到与 "' + term + '" 匹配的图标') : '没有可展示的图标';
  listEl.appendChild(li);
}

function renderFontClassIcons(groupedIcons) {
  var fontclassList = document.getElementById('icons-list-fontclass');
  clearElement(fontclassList);
  if (!groupedIcons || Object.keys(groupedIcons).length === 0) {
    renderNoResults(fontclassList, lastSearchTerm);
    return;
  }
  Object.keys(groupedIcons).sort().forEach(function(letter) {
    var iconCount = groupedIcons[letter].length;
    var separator = document.createElement('li');
    separator.className = 'letter-separator';
    separator.innerHTML = '<h3>' + letter + ' <span class="category-count">' + iconCount + '</span></h3>';
    fontclassList.appendChild(separator);
    
    groupedIcons[letter].forEach(function(iconName) {
      var li = document.createElement('li');
      li.className = 'icon-item';
      var chineseTags = getIconTags(iconName);
      
      li.innerHTML = '<i class="its-icon-' + iconName + '"></i><h4>' + iconName + '</h4>' + renderChineseTags(chineseTags);
      li.onclick = function() {
        copyToClipboard('<i class="its-icon-' + iconName + '"></i>', iconName);
      };
      fontclassList.appendChild(li);
    });
  });
}

function renderSymbolIcons(groupedIcons) {
  var symbolList = document.getElementById('icons-list-symbol');
  clearElement(symbolList);
  if (!groupedIcons || Object.keys(groupedIcons).length === 0) {
    renderNoResults(symbolList, lastSearchTerm);
    return;
  }
  Object.keys(groupedIcons).sort().forEach(function(letter) {
    var iconCount = groupedIcons[letter].length;
    var separator = document.createElement('li');
    separator.className = 'letter-separator';
    separator.innerHTML = '<h3>' + letter + ' <span class="category-count">' + iconCount + '</span></h3>';
    symbolList.appendChild(separator);
    
    groupedIcons[letter].forEach(function(iconName) {
      var li = document.createElement('li');
      li.className = 'icon-item';
      var chineseTags = getIconTags(iconName);
      
      li.innerHTML = '<svg><use xlink:href="#its-icon-' + iconName + '"></use></svg><h4>' + iconName + '</h4>' + renderChineseTags(chineseTags);
      li.onclick = function() {
        copyToClipboard('<svg><use xlink:href="#its-icon-' + iconName + '"></use></svg>', iconName);
      };
      symbolList.appendChild(li);
    });
  });
}

function renderUnicodeIcons(groupedIcons, unicodeMap) {
  var unicodeList = document.getElementById('icons-list-unicode');
  clearElement(unicodeList);
  if (!groupedIcons || Object.keys(groupedIcons).length === 0) {
    renderNoResults(unicodeList, lastSearchTerm);
    return;
  }
  Object.keys(groupedIcons).sort().forEach(function(letter) {
    var iconCount = groupedIcons[letter].length;
    var separator = document.createElement('li');
    separator.className = 'letter-separator';
    separator.innerHTML = '<h3>' + letter + ' <span class="category-count">' + iconCount + '</span></h3>';
    unicodeList.appendChild(separator);
    
    groupedIcons[letter].forEach(function(iconName) {
      var unicode = unicodeMap[iconName] || 'e000';
      var li = document.createElement('li');
      li.className = 'icon-item';
      var chineseTags = getIconTags(iconName);
      
      li.innerHTML = '<i class="its-icon-' + iconName + '"></i><h4>' + iconName + '</h4>' + renderChineseTags(chineseTags) + '<span class="unicode">&amp;#x' + unicode + ';</span>';
      li.onclick = function() {
        copyToClipboard('<i class="its-icon">&#x' + unicode + ';</i>', iconName);
      };
      unicodeList.appendChild(li);
    });
  });
}

function renderAllTabs(iconNames) {
  var grouped = groupIconNamesByLetter(iconNames);
  renderFontClassIcons(grouped);
  renderSymbolIcons(grouped);
  renderUnicodeIcons(grouped, unicodeMapCache);
}

function normalizeSearchTerm(term) {
  return (term || '').toString().trim().toLowerCase();
}

function iconMatchesTerm(iconName, term) {
  if (!term) return true;
  if ((iconName || '').toLowerCase().indexOf(term) !== -1) return true;
  try {
    var tags = getIconTags(iconName);
    if (tags && tags.length) {
      for (var i = 0; i < tags.length; i++) {
        if ((tags[i] || '').toLowerCase().indexOf(term) !== -1) return true;
      }
    }
  } catch (e) {}
  return false;
}

function applySearch(term) {
  lastSearchTerm = term || '';
  var normalized = normalizeSearchTerm(term);
  var filtered = normalized
    ? allIconNames.filter(function(name) { return iconMatchesTerm(name, normalized); })
    : allIconNames.slice();

  renderAllTabs(filtered);
  updateIconCountInHeader(filtered);

  var iconsWrap = document.querySelector('.icons');
  if (iconsWrap) iconsWrap.scrollTop = 0;
}

function setSearchActive(active) {
  var box = document.getElementById('search-box');
  if (!box) return;
  if (active) box.classList.add('active');
  else box.classList.remove('active');
}

function updateSearchClearVisibility(value) {
  var box = document.getElementById('search-box');
  if (!box) return;
  if (value && value.length) box.classList.add('has-value');
  else box.classList.remove('has-value');
}

function initSearch() {
  var box = document.getElementById('search-box');
  var input = document.getElementById('search-input');
  var btn = document.getElementById('search-btn');
  var clearBtn = document.getElementById('search-clear');
  if (!box || !input || !btn) return;

  function collapseIfPossible() {
    var v = (input.value || '').trim();
    if (!v) setSearchActive(false);
  }

  function focusInput() {
    setSearchActive(true);
    input.focus();
    input.select();
  }

  btn.onclick = function(e) {
    e.preventDefault();
    if (box.classList.contains('active')) {
      // 已展开：再次点击可收回（若有内容则保留展开）
      collapseIfPossible();
      if (box.classList.contains('active')) focusInput();
    } else {
      focusInput();
    }
  };

  if (clearBtn) {
    clearBtn.onclick = function(e) {
      e.preventDefault();
      input.value = '';
      updateSearchClearVisibility('');
      applySearch('');
      // 清空后保持展开并聚焦，方便继续输入
      focusInput();
    };
  }

  input.addEventListener('input', function() {
    var v = input.value || '';
    updateSearchClearVisibility(v);
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(function() {
      applySearch(v);
    }, 120);
  });

  input.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      input.value = '';
      updateSearchClearVisibility('');
      applySearch('');
      setSearchActive(false);
      input.blur();
    }
  });

  input.addEventListener('blur', function() {
    // 延迟：允许点击清空按钮/搜索按钮不被 blur 立即收起打断
    setTimeout(function() {
      var active = document.activeElement;
      if (!box.contains(active)) {
        collapseIfPossible();
      }
    }, 0);
  });

  document.addEventListener('mousedown', function(e) {
    if (!box.classList.contains('active')) return;
    if (!box.contains(e.target)) {
      collapseIfPossible();
    }
  });

  document.addEventListener('keydown', function(e) {
    var isMac = navigator.platform && navigator.platform.toLowerCase().indexOf('mac') !== -1;
    var isCtrlK = (e.key === 'k' || e.key === 'K') && (isMac ? e.metaKey : e.ctrlKey);
    var isSlash = e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey;
    var tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
    var isTyping = tag === 'input' || tag === 'textarea' || (e.target && e.target.isContentEditable);
    if ((isCtrlK || isSlash) && !isTyping) {
      e.preventDefault();
      focusInput();
    }
  });
}

// 更新头部图标总数显示
function updateIconCountInHeader(iconNames) {
  var countEl = document.getElementById('icon-count');
  if (!countEl || !iconNames || iconNames.length === 0) return;
  countEl.textContent = iconNames.length;
}

// 加载和渲染图标
function loadAndRenderIcons() {
  var hasInline =
    typeof window !== 'undefined' &&
    window.INLINE_ICON_DATA &&
    window.INLINE_SVG_DATA &&
    window.INLINE_CSS_DATA;

  var iconDataPromise = hasInline
    ? Promise.resolve(window.INLINE_ICON_DATA)
    : fetch("its-icon.json").then(function(res) { return res.json(); }).catch(function() { return {}; });

  var svgPromise = hasInline
    ? Promise.resolve(window.INLINE_SVG_DATA)
    : fetch("its-icon.symbol.svg").then(function(res) { return res.text(); }).catch(function() { return ''; });

  var cssPromise = hasInline
    ? Promise.resolve(window.INLINE_CSS_DATA)
    : fetch("its-icon.css").then(function(res) { return res.text(); }).catch(function() { return ''; });

  Promise.all([iconDataPromise, svgPromise, cssPromise, loadIconTags()]).then(function(results) {
    var iconData = results[0];
    var svgContent = results[1];
    var cssContent = results[2];
    
    if (!iconData || Object.keys(iconData).length === 0) {
      showErrorMessage();
      return;
    }
    
    insertSvgContent(svgContent);
    unicodeMapCache = parseUnicodeMap(cssContent);
    allIconNames = Object.keys(iconData || {}).sort();
    renderAllTabs(allIconNames);
    updateIconCountInHeader(allIconNames);
    
    if (typeof updateHelpContent === 'function') {
      updateHelpContent();
    }
  }).catch(function(err) {
    console.error('Error loading icons:', err);
  });
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    initTabs();
    initFrameworkTabs();
    initSearch();
    loadAndRenderIcons();
  });
} else {
  initTabs();
  initFrameworkTabs();
  initSearch();
  loadAndRenderIcons();
}`;
}

// 执行创建函数
createAdditionalJSFiles();