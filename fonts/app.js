// 主应用逻辑
var STORAGE_KEY_TAB = 'iconthemestudio:tab';
var STORAGE_KEY_FRAMEWORK = 'iconthemestudio:framework';
var STORAGE_KEY_COLOR_BINDINGS = 'iconthemestudio:color-bindings';
var STORAGE_KEY_COLOR_VARIABLE_VALUES = 'iconthemestudio:color-variable-values';
var VALID_TABS = { fontclass: true, symbol: true, unicode: true };
var VALID_FRAMEWORKS = { html: true, react: true, vue: true, angular: true };
var DEFAULT_ICON_PRIMARY = '#ACEE2A';
var DEFAULT_ICON_SECONDARY = '#FFFFFF';
var COMMON_THEME_COLORS = ['#F44336', '#FF9800', '#FFC107', '#8BC34A', '#4CAF50', '#00BCD4', '#2196F3', '#3F51B5', '#9C27B0', '#E91E63', '#607D8B', '#000000', '#FFFFFF'];

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
var iconOriginalSvgContent = '';
var iconColorValues = [];
var colorBindings = { primary: null, secondary: null };
var colorPendingSelections = { primary: null, secondary: null };
var colorVariableValues = { primary: DEFAULT_ICON_PRIMARY, secondary: DEFAULT_ICON_SECONDARY };

function normalizeColorValue(color) {
  var v = (color || '').toString().trim();
  if (!v) return null;
  var lower = v.toLowerCase();
  if (lower === 'none' || lower === 'currentcolor' || lower.indexOf('url(') === 0 || lower.indexOf('var(') === 0 || lower === 'transparent') {
    return null;
  }
  var hex = lower.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    var value = hex[1].toUpperCase();
    if (value.length === 3) {
      value = value[0] + value[0] + value[1] + value[1] + value[2] + value[2];
    }
    return '#' + value;
  }
  var rgb = lower.match(/^rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)$/i);
  if (rgb) {
    var r = Math.max(0, Math.min(255, parseInt(rgb[1], 10)));
    var g = Math.max(0, Math.min(255, parseInt(rgb[2], 10)));
    var b = Math.max(0, Math.min(255, parseInt(rgb[3], 10)));
    var toHex = function(n) { return (n < 16 ? '0' : '') + n.toString(16).toUpperCase(); };
    return '#' + toHex(r) + toHex(g) + toHex(b);
  }
  return v;
}

function extractIconColors(svgContent) {
  var colors = {};
  var regex = /(fill|stroke)\s*=\s*["']([^"']+)["']/gi;
  var match;
  while ((match = regex.exec(svgContent || '')) !== null) {
    var normalized = normalizeColorValue(match[2]);
    if (!normalized) continue;
    colors[normalized] = true;
  }
  return Object.keys(colors).sort();
}

function parseStoredColorBindings() {
  var raw = safeGetStorageItem(STORAGE_KEY_COLOR_BINDINGS);
  if (!raw) return { primary: null, secondary: null };
  try {
    var parsed = JSON.parse(raw);
    return {
      primary: normalizeColorValue(parsed && parsed.primary),
      secondary: normalizeColorValue(parsed && parsed.secondary)
    };
  } catch (e) {
    return { primary: null, secondary: null };
  }
}

function parseStoredColorVariableValues() {
  var raw = safeGetStorageItem(STORAGE_KEY_COLOR_VARIABLE_VALUES);
  if (!raw) {
    return { primary: DEFAULT_ICON_PRIMARY, secondary: DEFAULT_ICON_SECONDARY };
  }
  try {
    var parsed = JSON.parse(raw);
    return {
      primary: normalizeColorValue(parsed && parsed.primary) || DEFAULT_ICON_PRIMARY,
      secondary: normalizeColorValue(parsed && parsed.secondary) || DEFAULT_ICON_SECONDARY
    };
  } catch (e) {
    return { primary: DEFAULT_ICON_PRIMARY, secondary: DEFAULT_ICON_SECONDARY };
  }
}

function applyIconColorBindings(svgContent, bindings) {
  var primary = bindings && normalizeColorValue(bindings.primary);
  var secondary = bindings && normalizeColorValue(bindings.secondary);
  if (!primary && !secondary) return svgContent;
  return (svgContent || '').replace(/(fill|stroke)\s*=\s*["']([^"']+)["']/gi, function(_, attr, val) {
    var normalized = normalizeColorValue(val);
    if (primary && normalized === primary) return attr + '="var(--its-icon-primary)"';
    if (secondary && normalized === secondary) return attr + '="var(--its-icon-secondary)"';
    return attr + '="' + val + '"';
  });
}

function updateIconCssVariables() {
  if (!document || !document.documentElement || !document.documentElement.style) return;
  var primary = normalizeColorValue(colorVariableValues.primary) || DEFAULT_ICON_PRIMARY;
  var secondary = normalizeColorValue(colorVariableValues.secondary) || DEFAULT_ICON_SECONDARY;
  document.documentElement.style.setProperty('--its-icon-primary', primary);
  document.documentElement.style.setProperty('--its-icon-secondary', secondary);
}

function persistColorBindings() {
  safeSetStorageItem(STORAGE_KEY_COLOR_BINDINGS, JSON.stringify({
    primary: colorBindings.primary || null,
    secondary: colorBindings.secondary || null
  }));
}

function persistColorVariableValues() {
  safeSetStorageItem(STORAGE_KEY_COLOR_VARIABLE_VALUES, JSON.stringify({
    primary: colorVariableValues.primary || DEFAULT_ICON_PRIMARY,
    secondary: colorVariableValues.secondary || DEFAULT_ICON_SECONDARY
  }));
}

function renderColorBindValue(el, colorValue, placeholder) {
  if (!el) return;
  if (!colorValue) {
    el.textContent = placeholder || '未绑定';
    return;
  }
  el.innerHTML = '<span class="color-dot" style="background:' + colorValue + '"></span><span>' + colorValue + '</span>';
}

function updateColorBindingSummary() {
  var primaryEl = document.getElementById('bind-primary-value');
  var secondaryEl = document.getElementById('bind-secondary-value');
  renderColorBindValue(primaryEl, colorPendingSelections.primary || colorBindings.primary, '未绑定');
  renderColorBindValue(secondaryEl, colorPendingSelections.secondary || colorBindings.secondary, '未绑定');
}

function renderColorPoolForTarget(target) {
  var pool = document.getElementById(target === 'secondary' ? 'icon-color-pool-secondary' : 'icon-color-pool-primary');
  if (!pool) return;
  pool.innerHTML = '';
  if (!iconColorValues.length) {
    pool.innerHTML = '<span style="font-size:12px;color:#999;">未扫描到可绑定颜色</span>';
    return;
  }
  var otherTarget = target === 'secondary' ? 'primary' : 'secondary';
  var selected = normalizeColorValue(colorPendingSelections[target]);
  var selectedOther = normalizeColorValue(colorPendingSelections[otherTarget]);
  iconColorValues.forEach(function(color) {
    var chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'color-chip';
    var isActive = selected && selected === color;
    var isDisabled = selectedOther && selectedOther === color;
    if (isActive) chip.classList.add('active');
    if (isDisabled) chip.classList.add('disabled');
    chip.disabled = !!isDisabled;
    chip.innerHTML = '<span class="color-dot" style="background:' + color + '"></span><span>' + color + '</span>';
    chip.onclick = function() {
      if (isDisabled) return;
      colorPendingSelections[target] = isActive ? null : color;
      updateCommitButtonState();
      updateColorBindingSummary();
      renderColorPools();
    };
    pool.appendChild(chip);
  });
}

function renderColorPools() {
  renderColorPoolForTarget('primary');
  renderColorPoolForTarget('secondary');
}

function updateCommitButtonState() {
  var commitBtn = document.getElementById('apply-color-binding-btn');
  if (!commitBtn) return;
  var hasPrimary = !!normalizeColorValue(colorPendingSelections.primary);
  var hasSecondary = !!normalizeColorValue(colorPendingSelections.secondary);
  commitBtn.disabled = !(hasPrimary && hasSecondary);
}

function applyColorBindingsToPreview() {
  if (!iconOriginalSvgContent) return;
  var transformed = applyIconColorBindings(iconOriginalSvgContent, colorBindings);
  insertSvgContent(transformed);
  updateIconCssVariables();
  persistColorBindings();
}

function renderThemeColorRow(containerId, target) {
  var container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  var active = normalizeColorValue(colorVariableValues[target]);
  COMMON_THEME_COLORS.forEach(function(color) {
    var chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'theme-color-chip';
    if (normalizeColorValue(color) === '#FFFFFF') chip.classList.add('is-light');
    if (active === color) chip.classList.add('active');
    chip.style.background = color;
    chip.title = color;
    chip.onclick = function() {
      colorVariableValues[target] = color;
      updateIconCssVariables();
      persistColorVariableValues();
      renderThemeColorRow('theme-primary-colors', 'primary');
      renderThemeColorRow('theme-secondary-colors', 'secondary');
    };
    container.appendChild(chip);
  });
}

function initThemePreviewModal() {
  var modal = document.getElementById('theme-preview-modal');
  var openBtn = document.getElementById('theme-preview-btn');
  var closeBtn = document.getElementById('theme-preview-close');
  if (!modal || !openBtn || !closeBtn) return;
  var content = modal.querySelector('.modal-content');

  function positionThemePreviewModal() {
    if (!content) return;
    var rect = openBtn.getBoundingClientRect();
    var margin = 8;
    var panelWidth = content.offsetWidth || 640;
    var left = rect.right - panelWidth;
    if (left < 12) left = 12;
    var maxLeft = window.innerWidth - panelWidth - 12;
    if (left > maxLeft) left = Math.max(12, maxLeft);
    var top = rect.bottom + margin;
    modal.style.left = left + 'px';
    modal.style.top = top + 'px';
  }

  openBtn.onclick = function() {
    var hasPrimaryBinding = !!normalizeColorValue(colorBindings.primary);
    var hasSecondaryBinding = !!normalizeColorValue(colorBindings.secondary);
    var hasColorBindButton = !!document.getElementById('color-bind-btn');
    if (hasColorBindButton && (!hasPrimaryBinding || !hasSecondaryBinding)) {
      if (typeof showToast === 'function') {
        showToast('请先在颜色绑定中完成主色和辅色绑定', 'info');
      }
      return;
    }
    if (currentTab !== 'symbol') {
      setActiveTab('symbol');
    }
    renderThemeColorRow('theme-primary-colors', 'primary');
    renderThemeColorRow('theme-secondary-colors', 'secondary');
    modal.classList.add('show');
    positionThemePreviewModal();
  };
  closeBtn.onclick = function() { modal.classList.remove('show'); };
  document.addEventListener('mousedown', function(e) {
    if (!modal.classList.contains('show')) return;
    if (modal.contains(e.target) || openBtn.contains(e.target)) return;
    modal.classList.remove('show');
  });
  window.addEventListener('resize', function() {
    if (!modal.classList.contains('show')) return;
    positionThemePreviewModal();
  });
  window.addEventListener('scroll', function() {
    if (!modal.classList.contains('show')) return;
    positionThemePreviewModal();
  }, true);
}

function initColorBindModal() {
  var modal = document.getElementById('color-bind-modal');
  var openBtn = document.getElementById('color-bind-btn');
  var closeBtn = document.getElementById('color-bind-close');
  var applyBtn = document.getElementById('apply-color-binding-btn');
  var resetBtn = document.getElementById('reset-color-binding-btn');
  if (!modal || !openBtn || !closeBtn) return;

  openBtn.onclick = function() {
    colorPendingSelections = {
      primary: colorBindings.primary,
      secondary: colorBindings.secondary
    };
    renderColorPools();
    updateColorBindingSummary();
    updateCommitButtonState();
    modal.classList.add('show');
  };
  closeBtn.onclick = function() { modal.classList.remove('show'); };
  modal.onclick = function(e) { if (e.target === modal) modal.classList.remove('show'); };

  if (applyBtn) {
    applyBtn.onclick = function() {
      var primary = normalizeColorValue(colorPendingSelections.primary);
      var secondary = normalizeColorValue(colorPendingSelections.secondary);
      if (!primary || !secondary) return;
      if (primary === secondary) {
        if (typeof showToast === 'function') showToast('主色和辅色不能相同', 'info');
        return;
      }
      colorBindings.primary = primary;
      colorBindings.secondary = secondary;
      persistColorBindings();
      applyColorBindingsToPreview();
      updateColorBindingSummary();
      renderColorPools();
      updateCommitButtonState();
      if (typeof showToast === 'function') showToast('绑定成功', 'success');
    };
  }
  if (resetBtn) {
    resetBtn.onclick = function() {
      colorBindings = { primary: null, secondary: null };
      colorPendingSelections = { primary: null, secondary: null };
      persistColorBindings();
      updateColorBindingSummary();
      renderColorPools();
      updateCommitButtonState();
      insertSvgContent(iconOriginalSvgContent);
      updateIconCssVariables();
      if (typeof showToast === 'function') showToast('已重置颜色绑定', 'info');
    };
  }
}

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
  var old = document.getElementById('its-symbol-defs');
  if (old && old.parentNode) old.parentNode.removeChild(old);
  var div = document.createElement('div');
  div.id = 'its-symbol-defs';
  div.style.display = 'none';
  div.innerHTML = svgContent;
  document.body.insertBefore(div, document.body.firstChild);
}

function parseUnicodeMap(cssContent) {
  var unicodeMap = {};
  var regex = /\.its-icon-([^:]+):before\s*\{\s*content:\s*"\\([^"]+)"/g;
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
      
      li.innerHTML = '<i class="its-icon-' + iconName + ' icon-glyph"></i><h4>' + iconName + '</h4>' + renderChineseTags(chineseTags);
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
      
      li.innerHTML = '<svg class="icon-glyph"><use xlink:href="#its-icon-' + iconName + '"></use></svg><h4>' + iconName + '</h4>' + renderChineseTags(chineseTags);
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
      
      li.innerHTML = '<i class="its-icon-' + iconName + ' icon-glyph"></i><h4>' + iconName + '</h4>' + renderChineseTags(chineseTags) + '<span class="unicode">&amp;#x' + unicode + ';</span>';
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
    
    iconOriginalSvgContent = svgContent || '';
    iconColorValues = extractIconColors(iconOriginalSvgContent);
    colorBindings = parseStoredColorBindings();
    colorVariableValues = parseStoredColorVariableValues();
    updateIconCssVariables();
    insertSvgContent(applyIconColorBindings(iconOriginalSvgContent, colorBindings));
    unicodeMapCache = parseUnicodeMap(cssContent);
    allIconNames = Object.keys(iconData || {}).sort();
    renderAllTabs(allIconNames);
    updateIconCountInHeader(allIconNames);
    renderColorPools();
    updateColorBindingSummary();
    
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
    initColorBindModal();
    initThemePreviewModal();
    loadAndRenderIcons();
  });
} else {
  initTabs();
  initFrameworkTabs();
  initSearch();
  initColorBindModal();
  initThemePreviewModal();
  loadAndRenderIcons();
}