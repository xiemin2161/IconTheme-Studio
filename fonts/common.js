// 通用函数
function parseChineseTags(iconName) {
  // 从标签文件中获取中文标签，而不是从文件名解析
  // 这个函数现在只是为了兼容性，实际标签数据来自icon-tags.json
  return null; // 将在loadIconTags中处理
}

// 全局变量存储标签数据
var iconTagsData = {
  "allModules": ["全部模块"],
  "bottom": ["向下"],
  "chapter": ["章节"],
  "clear": ["清除", "关闭"],
  "comments": ["评论", "聊天"],
  "contents": ["书目", "目录"],
  "contentsActive": ["书目选中", "目录"],
  "darkMode": ["深色模式", "月亮", "夜间"],
  "darkModeActive": ["深色模式选中", "月亮", "夜"],
  "download": ["下载"],
  "emptyStar": ["空星", "五角星"],
  "facebook": ["Facebook"],
  "filledStar": ["实星", "五角星"],
  "filter": ["筛选"],
  "halfStar": ["半实星", "五角星"],
  "hidden": ["不可见", "隐藏"],
  "hot": ["热门"],
  "image": ["图片", "照片"],
  "language": ["语言", "地球", "网络"],
  "left": ["向左"],
  "lightMode": ["亮色模式", "太阳", "白天"],
  "lightModeActive": ["亮色模式选中", "太阳", "白天"],
  "liked": ["喜欢", "爱心"],
  "lock": ["锁定", "密码"],
  "more": ["更多"],
  "new": ["最新"],
  "notification": ["通知", "提醒"],
  "play": ["播放"],
  "read": ["阅读", "眼睛", "可见"],
  "reddit": ["Reddit"],
  "refresh": ["刷新", "重置"],
  "right": ["向右"],
  "search": ["搜索", "查询"],
  "select": ["选中", "正确", "勾选"],
  "settings": ["设置", "齿轮"],
  "settingsActive": ["设置选中", "齿轮"],
  "share": ["分享"],
  "swipeLeft": ["左划"],
  "telegram": ["Telegram"],
  "textEnlarge": ["文字放大"],
  "textShrink": ["文字缩小"],
  "theme": ["主题"],
  "top": ["向上"],
  "unliked": ["不喜欢", "爱心"],
  "user": ["用户"],
  "VIP": ["VIP"],
  "visible": ["显示", "可见"],
  "whatsApp": ["WhatsApp"],
  "X": ["推特"]
};

function loadIconTags() {
  // 1) 离线包（file://）会内联标签数据
  if (typeof window !== 'undefined' && window.INLINE_ICON_TAGS) {
    iconTagsData = window.INLINE_ICON_TAGS;
    return Promise.resolve(iconTagsData);
  }

  // 2) 在线/服务器：优先读取构建生成的 icon-tags.json（包含全部图标标签）
  if (typeof window !== 'undefined' && window.location && window.location.protocol !== 'file:') {
    return fetch('icon-tags.json')
      .then(function(res) { return res.json(); })
      .then(function(data) {
        iconTagsData = data || {};
        return iconTagsData;
      })
      .catch(function() {
        // 兜底：使用内嵌的标签数据
        return iconTagsData;
      });
  }

  // 3) 兜底：使用内嵌的标签数据
  return Promise.resolve(iconTagsData);
}

function getIconTags(iconName) {
  // 从加载的标签数据中获取标签
  return iconTagsData[iconName] || null;
}

function convertIconNameToCssClass(iconName) {
  // 将图标名称转换为CSS类名格式
  // All_Modules -> all-modules
  return iconName
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/[^a-z0-9-]/g, ''); // 移除非字母数字和连字符的字符
}

function renderChineseTags(tags) {
  if (!tags || tags.length === 0) {
    return '<div class="chinese-tags"><span class="no-tags">无</span></div>';
  }
  
  var tagsHtml = tags.map(function(tag) {
    return '<span class="tag">' + tag + '</span>';
  }).join('');
  
  return '<div class="chinese-tags">' + tagsHtml + '</div>';
}

function showToast(message, type) {
  // 默认类型为 success
  type = type || 'success';
  
  // 确保容器存在
  var container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  
  // 创建新的 toast 元素
  var toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  
  // 根据类型创建不同的图标
  var iconHTML = '';
  if (type === 'success') {
    iconHTML = '<div class="toast-icon">' +
      '<svg viewBox="0 0 52 52">' +
      '<circle class="circle" cx="26" cy="26" r="25"/>' +
      '<path class="checkmark" d="M14 27l7.5 7.5L38 18"/>' +
      '</svg>' +
      '</div>';
  } else if (type === 'info') {
    iconHTML = '<div class="toast-icon">' +
      '<svg viewBox="0 0 52 52">' +
      '<circle class="circle" cx="26" cy="26" r="25"/>' +
      '<path class="info-icon" d="M26 16v4M26 26v12"/>' +
      '</svg>' +
      '</div>';
  } else if (type === 'error') {
    iconHTML = '<div class="toast-icon">' +
      '<svg viewBox="0 0 52 52">' +
      '<circle class="circle" cx="26" cy="26" r="25"/>' +
      '<path class="error-icon" d="M18 18l16 16M34 18l-16 16"/>' +
      '</svg>' +
      '</div>';
  }
  
  toast.innerHTML = iconHTML + '<span class="toast-message">' + message + '</span>';
  container.appendChild(toast);
  
  // 触发显示动画
  setTimeout(function() {
    toast.classList.add('show');
  }, 10);
  
  // 3秒后开始消失动画
  setTimeout(function() {
    toast.classList.add('hide');
    toast.classList.remove('show');
    
    // 动画结束后移除元素
    setTimeout(function() {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      // 如果容器为空，移除容器
      if (container.children.length === 0) {
        container.parentNode.removeChild(container);
      }
    }, 400);
  }, 3000);
}

function copyToClipboard(text, name) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function() {
      if (name === '代码块') {
        showToast('复制代码块成功', 'success');
      } else if (name) {
        showToast('复制 ' + name + ' 图标成功', 'success');
      } else {
        showToast('复制成功', 'success');
      }
    }).catch(function() {
      fallbackCopy(text, name);
    });
  } else {
    fallbackCopy(text, name);
  }
}

function fallbackCopy(text, name) {
  var textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    if (name === '代码块') {
      showToast('复制代码块成功', 'success');
    } else if (name) {
      showToast('复制 ' + name + ' 图标成功', 'success');
    } else {
      showToast('复制成功', 'success');
    }
  } catch (err) {
    showToast('复制失败，请手动复制', 'error');
  }
  document.body.removeChild(textarea);
}

// 模态框控制
function initModal() {
  var modal = document.getElementById('help-modal');
  var helpBtn = document.getElementById('help-btn');
  var closeBtn = document.querySelector('.modal-close');
  
  if (helpBtn) {
    helpBtn.onclick = function() { 
      modal.classList.add('show');
      highlightCode();
      addCopyButtons();
    };
  }
  if (closeBtn) {
    closeBtn.onclick = function() { modal.classList.remove('show'); };
  }
  modal.onclick = function(e) {
    if (e.target === modal) modal.classList.remove('show');
  };
}

// 代码高亮
function highlightCode() {
  var codeBlocks = document.querySelectorAll('.modal-body code');
  codeBlocks.forEach(function(code) {
    if (code.getAttribute('data-highlighted')) return;
    
    var text = code.textContent;
    var html = '';
    
    // 简单的 HTML 语法高亮
    var i = 0;
    while (i < text.length) {
      if (text[i] === '<') {
        // 找到标签结束位置
        var tagEnd = text.indexOf('>', i);
        if (tagEnd === -1) {
          html += escapeHtml(text.substring(i));
          break;
        }
        
        var tag = text.substring(i, tagEnd + 1);
        var tagContent = tag.substring(1, tag.length - 1);
        
        // 分离标签名和属性
        var spaceIndex = tagContent.indexOf(' ');
        var tagName = spaceIndex === -1 ? tagContent : tagContent.substring(0, spaceIndex);
        var attrs = spaceIndex === -1 ? '' : tagContent.substring(spaceIndex);
        
        // 高亮标签
        html += '&lt;<span class="tag">' + escapeHtml(tagName) + '</span>';
        
        // 高亮属性
        if (attrs) {
          attrs = attrs.replace(/([\w-]+)="([^"]*)"/g, ' <span class="attr">$1</span>=<span class="string">"$2"</span>');
          html += attrs;
        }
        
        html += '<span class="tag">&gt;</span>';
        i = tagEnd + 1;
      } else {
        html += escapeHtml(text[i]);
        i++;
      }
    }
    
    code.innerHTML = html;
    code.setAttribute('data-highlighted', 'true');
  });
}

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

// 添加复制按钮
function addCopyButtons() {
  var preBlocks = document.querySelectorAll('.modal-body pre');
  preBlocks.forEach(function(pre) {
    if (pre.querySelector('.copy-code-btn')) return;
    
    var btn = document.createElement('button');
    btn.className = 'copy-code-btn';
    btn.textContent = '复制';
    btn.onclick = function(e) {
      e.stopPropagation();
      var code = pre.querySelector('code');
      if (code) {
        var text = code.textContent;
        copyToClipboard(text, '代码块');
        btn.textContent = '已复制';
        setTimeout(function() {
          btn.textContent = '复制';
        }, 2000);
      }
    };
    pre.appendChild(btn);
  });
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initModal);
} else {
  initModal();
}
