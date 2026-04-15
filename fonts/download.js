// 统一的下载功能
(function() {
  var STORAGE_KEY_COLOR_BINDINGS = 'iconthemestudio:color-bindings';
  var DEFAULT_ICON_PRIMARY = '#ACEE2A';
  var DEFAULT_ICON_SECONDARY = '#FFFFFF';

  function normalizeColorValue(color) {
    var v = (color || '').toString().trim();
    if (!v) return null;
    var lower = v.toLowerCase();
    if (lower === 'none' || lower === 'currentcolor' || lower.indexOf('url(') === 0 || lower === 'transparent') {
      return null;
    }
    var hex = lower.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hex) {
      var value = hex[1].toUpperCase();
      if (value.length === 3) value = value[0] + value[0] + value[1] + value[1] + value[2] + value[2];
      return '#' + value;
    }
    return v;
  }

  function getStoredBindings() {
    try {
      var raw = window && window.localStorage ? window.localStorage.getItem(STORAGE_KEY_COLOR_BINDINGS) : null;
      if (!raw) return { primary: null, secondary: null };
      var parsed = JSON.parse(raw);
      return {
        primary: normalizeColorValue(parsed && parsed.primary),
        secondary: normalizeColorValue(parsed && parsed.secondary)
      };
    } catch (e) {
      return { primary: null, secondary: null };
    }
  }

  function applyColorBindingsToSvg(svgContent, bindings) {
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

  function ensureIconCssVars(cssContent, bindings) {
    var primary = normalizeColorValue(bindings && bindings.primary) || DEFAULT_ICON_PRIMARY;
    var secondary = normalizeColorValue(bindings && bindings.secondary) || DEFAULT_ICON_SECONDARY;
    var varsBlock = ':root{--its-icon-primary:' + primary + ';--its-icon-secondary:' + secondary + ';}\n';
    if ((cssContent || '').indexOf('--its-icon-primary') !== -1 || (cssContent || '').indexOf('--its-icon-secondary') !== -1) {
      return cssContent;
    }
    return varsBlock + (cssContent || '');
  }

  // 等待 DOM 加载完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDownload);
  } else {
    initDownload();
  }
  
  function initDownload() {
    var downloadBtn = document.getElementById('download-btn');
    if (!downloadBtn) return;
    
    downloadBtn.onclick = function() {
      // 检查 showToast 函数是否存在
      var toast = typeof showToast === 'function' ? showToast : function(msg) { console.log(msg); };
      
      toast('正在准备下载...', 'info');

      // 离线 file:// 预览包：浏览器通常禁止 fetch 读取本地文件，避免误导用户
      if (typeof window !== 'undefined' && window.location && window.location.protocol === 'file:') {
        toast('离线预览包不支持再次打包下载，请用本地服务器打开原始目录后下载。', 'info');
        return;
      }
      
      if (typeof JSZip === 'undefined') {
        toast('正在加载下载组件...', 'info');
        return;
      }
      
      var zip = new JSZip();

      function toBase64(str) {
        return btoa(unescape(encodeURIComponent(str)));
      }

      function buildOfflineInlineDataScript(inlineIconDataStr, inlineSvgBase64, inlineCssBase64, inlineTagsDataStr) {
        return [
          '<script>',
          '  // 内联数据（用于 file:// 离线打开时绕过 fetch 限制）',
          '  window.INLINE_ICON_DATA = ' + inlineIconDataStr + ';',
          '  window.INLINE_SVG_DATA = decodeURIComponent(escape(atob("' + inlineSvgBase64 + '")));',
          '  window.INLINE_CSS_DATA = decodeURIComponent(escape(atob("' + inlineCssBase64 + '")));',
          '  window.INLINE_ICON_TAGS = ' + inlineTagsDataStr + ';',
          '</script>'
        ].join('\n');
      }

      function sanitizeOfflineIndexHtml(html) {
        // 移除可能存在的 dev server 注入（不影响静态打开）
        html = html.replace(/\s*<script[^>]*src="\/@vite\/client"[^>]*>\s*<\/script>\s*/g, '\n');
        html = html.replace(/\s*<script[^>]*src="\/__vite_ping"[^>]*>\s*<\/script>\s*/g, '\n');
        html = html.replace(/\s*<script[^>]*src="webpack-dev-server[^"]*"[^>]*>\s*<\/script>\s*/g, '\n');
        html = html.replace(/\s*<script[^>]*src="livereload[^"]*"[^>]*>\s*<\/script>\s*/g, '\n');
        return html;
      }

      function buildOfflineIndexHtmlFromTemplate(templateHtml, version, inlineScript, keepThemePreviewButton) {
        var html = templateHtml || '';
        html = sanitizeOfflineIndexHtml(html);

        // 更新版本号（zip 内的 index.html 不依赖在线页面的硬编码版本）
        if (version) {
          html = html.replace(/<h1>\s*(?:IconTheme Studio|IconTheme Studio)<sup>[^<]*<\/sup>\s*<\/h1>/i, '<h1>IconTheme Studio<sup>' + version + '</sup></h1>');
        }

        // 下载包中 index.html 位于根目录，资源路径需要从 ../assets/* 改为 assets/*
        html = html.replace(/\.\.\/assets\//g, 'assets/');

        // 离线包不需要再次下载打包，移除下载按钮与相关脚本
        html = html.replace(/\s*<script\s+src="vendor\/jszip\.min\.js"><\/script>\s*/gi, '\n');
        html = html.replace(/\s*<script\s+src="download\.js"><\/script>\s*/gi, '\n');
        html = html.replace(/\s*<a\s+id="download-btn"[\s\S]*?<\/a>\s*/i, '\n');
        html = html.replace(/\s*<a\s+id="color-bind-btn"[\s\S]*?<\/a>\s*/i, '\n');
        if (!keepThemePreviewButton) {
          html = html.replace(/\s*<a\s+id="theme-preview-btn"[\s\S]*?<\/a>\s*/i, '\n');
        }

        // 注入内联数据脚本
        var marker = '<!-- __OFFLINE_INLINE_DATA__ -->';
        if (html.indexOf(marker) !== -1) {
          html = html.replace(marker, inlineScript);
        } else {
          // 兜底：如果 marker 不存在，插到 common.js 前
          html = html.replace(/<script\s+src="common\.js"><\/script>/i, inlineScript + '\n  <script src="common.js"></script>');
        }

        return html;
      }

      // 获取 its-icon.json 数据
      fetch("its-icon.json")
        .then(function(res) { return res.json(); })
        .then(function(iconData) {
          
          var bindings = getStoredBindings();
          var hasPrimaryBinding = !!normalizeColorValue(bindings.primary);
          var hasSecondaryBinding = !!normalizeColorValue(bindings.secondary);
          if (!hasPrimaryBinding || !hasSecondaryBinding) {
            showConfirmDialog({
              title: '下载提示',
              message: '你还没有完成主色/辅色绑定。继续下载将生成固定色图标库，不能直接随项目主题变量联动。',
              confirmText: '继续下载',
              cancelText: '取消'
            }).then(function(shouldContinue) {
              if (!shouldContinue) {
                toast('已取消下载', 'info');
                return;
              }
              continueDownload(iconData, bindings, toast, zip, toBase64, buildOfflineInlineDataScript, buildOfflineIndexHtmlFromTemplate, hasPrimaryBinding && hasSecondaryBinding);
            });
            return;
          }
          continueDownload(iconData, bindings, toast, zip, toBase64, buildOfflineInlineDataScript, buildOfflineIndexHtmlFromTemplate, hasPrimaryBinding && hasSecondaryBinding);
        })
        .catch(function(err) {
          console.error('Error loading icon data:', err);
          toast('下载失败，请重试', 'error');
        });
    };
  }

  function showConfirmDialog(opts) {
    var title = (opts && opts.title) || '提示';
    var message = (opts && opts.message) || '';
    var confirmText = (opts && opts.confirmText) || '确定';
    var cancelText = (opts && opts.cancelText) || '取消';
    return new Promise(function(resolve) {
      var modal = document.createElement('div');
      modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:12000;display:flex;align-items:center;justify-content:center;';
      modal.innerHTML =
        '<div style="width:min(460px,calc(100vw - 24px));background:#fff;border-radius:10px;box-shadow:0 10px 35px rgba(0,0,0,.2);overflow:hidden;">' +
          '<div style="padding:14px 16px;border-bottom:1px solid #eee;font-size:15px;color:#333;font-weight:600;">' + title + '</div>' +
          '<div style="padding:16px;color:#555;font-size:13px;line-height:1.7;">' + message + '</div>' +
          '<div style="padding:12px 16px;display:flex;justify-content:flex-end;gap:8px;border-top:1px solid #eee;">' +
            '<button data-role="cancel" style="border:1px solid #d9d9d9;background:#fff;color:#555;border-radius:6px;padding:6px 12px;cursor:pointer;">' + cancelText + '</button>' +
            '<button data-role="ok" style="border:1px solid #3c75e4;background:#3c75e4;color:#fff;border-radius:6px;padding:6px 12px;cursor:pointer;">' + confirmText + '</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(modal);
      var cleaned = false;
      function done(val) {
        if (cleaned) return;
        cleaned = true;
        if (modal.parentNode) modal.parentNode.removeChild(modal);
        resolve(!!val);
      }
      modal.addEventListener('click', function(e) {
        if (e.target === modal) done(false);
      });
      var cancelBtn = modal.querySelector('[data-role="cancel"]');
      var okBtn = modal.querySelector('[data-role="ok"]');
      if (cancelBtn) cancelBtn.onclick = function() { done(false); };
      if (okBtn) okBtn.onclick = function() { done(true); };
    });
  }

  function continueDownload(iconData, bindings, toast, zip, toBase64, buildOfflineInlineDataScript, buildOfflineIndexHtmlFromTemplate, keepThemePreviewButton) {
          var readme = '# IconTheme Studio 使用说明\n\n' +
            '## 主题变量（颜色绑定）\n\n' +
            '下载包支持两个通用变量：\n' +
            '- --its-icon-primary（主色）\n' +
            '- --its-icon-secondary（辅色）\n\n' +
            '你可以在项目里覆盖它们：\n' +
            '```css\n' +
            ':root {\n' +
            '  --its-icon-primary: ' + (bindings.primary || DEFAULT_ICON_PRIMARY) + ';\n' +
            '  --its-icon-secondary: ' + (bindings.secondary || DEFAULT_ICON_SECONDARY) + ';\n' +
            '}\n' +
            '```\n\n' +
            '## FontClass 方式（推荐）\n\n' +
            '### 1. 引入文件\n' +
            '将以下文件复制到项目中：\n' +
            '- its-icon.css\n' +
            '- its-icon.woff2\n' +
            '- its-icon.woff\n' +
            '- its-icon.ttf\n' +
            '- its-icon.eot\n\n' +
            '### 2. 引入样式\n' +
            '```html\n' +
            '<link rel="stylesheet" href="path/to/its-icon.css">\n' +
            '```\n\n' +
            '### 3. 使用图标\n' +
            '```html\n' +
            '<i class="its-icon-language"></i>\n' +
            '```\n\n' +
            '## Symbol 方式\n\n' +
            '### 1. 引入文件\n' +
            '- its-icon.symbol.svg\n\n' +
            '### 2. 使用图标\n' +
            '```html\n' +
            '<' + 'script>\n' +
            '  fetch("path/to/its-icon.symbol.svg")\n' +
            '    .then(res => res.text())\n' +
            '    .then(svg => {\n' +
            '      const div = document.createElement("div");\n' +
            '      div.style.display = "none";\n' +
            '      div.innerHTML = svg;\n' +
            '      document.body.insertBefore(div, document.body.firstChild);\n' +
            '    });\n' +
            '<' + '/script>\n' +
            '<svg><use xlink:href="#its-icon-language"></use></svg>\n' +
            '```\n\n' +
            '## Unicode 方式\n\n' +
            '### 1. 引入样式\n' +
            '```html\n' +
            '<link rel="stylesheet" href="path/to/its-icon.css">\n' +
            '```\n\n' +
            '### 2. 使用图标\n' +
            '```html\n' +
            '<i class="its-icon">&#xe000;</i>\n' +
            '```\n\n' +
            '## 注意事项\n\n' +
            '1. CSS 文件中引用了字体文件的相对路径，确保 CSS 和字体文件在同一目录\n' +
            '2. 推荐使用 woff2 格式，现代浏览器都支持\n' +
            '3. 如需兼容 IE，请保留 eot 格式\n' +
            '4. 打开 index.html 可以预览所有图标\n';
          
          zip.file('README.md', readme);
          
          var files = [
            { name: 'its-icon.css', binary: false },
            { name: 'its-icon.woff2', binary: true },
            { name: 'its-icon.woff', binary: true },
            { name: 'its-icon.ttf', binary: true },
            { name: 'its-icon.eot', binary: true },
            { name: 'its-icon.symbol.svg', binary: false },
            { name: 'its-icon.json', binary: false },
            { name: 'icon-tags.json', binary: false },
            { name: 'common.css', binary: false },
            { name: 'common.js', binary: false },
            { name: 'help-content.js', binary: false },
            { name: 'app.js', binary: false }
          ];
          
          var promises = files.map(function(file) {
            return fetch(file.name)
              .then(function(response) {
                if (file.binary) {
                  return response.arrayBuffer();
                } else {
                  return response.text();
                }
              })
              .then(function(content) {
                return { name: file.name, content: content, binary: file.binary };
              })
              .catch(function(err) {
                console.error('Error loading ' + file.name + ':', err);
                return null;
              });
          });
          
          var cssPromise = fetch('its-icon.css').then(function(r) { return r.text(); });
          var svgPromise = fetch('its-icon.symbol.svg').then(function(r) { return r.text(); });
          var tagsPromise = fetch('icon-tags.json').then(function(r) { return r.json(); }).catch(function() { return {}; });
          var logoPromise = fetch('../assets/logo.svg').then(function(r) { return r.ok ? r.text() : null; }).catch(function() { return null; });
          var faviconPromise = fetch('../assets/favicon.svg').then(function(r) { return r.ok ? r.text() : null; }).catch(function() { return null; });

          Promise.all([Promise.all(promises), cssPromise, svgPromise, tagsPromise, logoPromise, faviconPromise]).then(function(results) {
            var fileContents = results[0];
            var cssContent = results[1];
            var svgContent = results[2];
            var tagsData = results[3] || {};
            var logoContent = results[4];
            var faviconContent = results[5];
            var transformedSvgContent = applyColorBindingsToSvg(svgContent, bindings);
            var transformedCssContent = ensureIconCssVars(cssContent, bindings);

            fileContents.forEach(function(fileData) {
              if (!fileData) return;
              if (fileData.name === 'its-icon.symbol.svg') fileData.content = transformedSvgContent;
              if (fileData.name === 'its-icon.css') fileData.content = transformedCssContent;
              if (fileData.binary) {
                zip.file(fileData.name, fileData.content);
              } else {
                zip.file(fileData.name, fileData.content);
              }
            });

            if (logoContent) zip.file('assets/logo.svg', logoContent);
            if (faviconContent) zip.file('assets/favicon.svg', faviconContent);

            // 生成干净的离线 index.html（避免任何 dev server 注入的 socket/livereload）
            var iconDataStr = JSON.stringify(iconData);
            var svgBase64 = toBase64(transformedSvgContent);
            var cssBase64 = toBase64(transformedCssContent);
            var tagsDataStr = JSON.stringify(tagsData);

            var versionEl = document.querySelector('.header h1 sup');
            var version = versionEl ? versionEl.textContent : '';
            var inlineScript = buildOfflineInlineDataScript(iconDataStr, svgBase64, cssBase64, tagsDataStr);

            return fetch('index.html')
              .then(function(r) { return r.text(); })
              .then(function(templateHtml) {
                zip.file('index.html', buildOfflineIndexHtmlFromTemplate(templateHtml, version, inlineScript, !!keepThemePreviewButton));
                return zip.generateAsync({ type: 'blob' });
              });

          }).then(function(blob) {
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'icontheme-studio.zip';
            a.click();
            URL.revokeObjectURL(url);
            toast('下载完成！', 'success');
          }).catch(function(err) {
            console.error('Error creating zip:', err);
            toast('下载失败，请重试', 'error');
          });
  }
})();
