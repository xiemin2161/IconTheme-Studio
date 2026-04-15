/**
 * Patch generated HTML files for offline compatibility / 修补生成 HTML 以支持离线使用。
 *
 * Responsibilities / 职责:
 * - Replace CDN JSZip reference with local vendored file. / 将 CDN JSZip 替换为本地 vendor 文件。
 * - Re-insert local JSZip tag if generator removed it. / 如生成器移除脚本标签则自动补回。
 * - Normalize malformed download button opening tag. / 规范化异常的下载按钮起始标签。
 */
const fs = require('fs');
const path = require('path');

function patchFile(filePath) {
  if (!fs.existsSync(filePath)) return false;
  const original = fs.readFileSync(filePath, 'utf8');
  let next = original;

  const cdnLine =
    '<script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>';
  const localLine = '<script src="vendor/jszip.min.js"></script>';
  const downloadBtnTag = '<a id="download-btn" title="下载图标包">';

  if (next.includes(cdnLine)) {
    next = next.replace(cdnLine, localLine);
  } else if (!next.includes('vendor/jszip.min.js')) {
    // If the generator removed the tag, re-insert it before common.js / 若生成器移除了脚本标签，则在 common.js 前补回。
    next = next.replace(
      '<script src="common.js"></script>',
      `${localLine}\n  <script src="common.js"></script>`,
    );
  }

  // Normalize malformed download button tag produced by encoding/editor issues. / 规整因编码或编辑器问题导致的异常下载按钮标签。
  // Example broken input: <a id="download-btn" title="下载图标�?> / 异常输入示例：<a id="download-btn" title="下载图标�?>
  next = next.replace(/<a id="download-btn"[^>]*>/g, downloadBtnTag);

  if (next !== original) {
    fs.writeFileSync(filePath, next, 'utf8');
    return true;
  }
  return false;
}

const projectRoot = process.cwd();

const patched = [
  patchFile(path.join(projectRoot, 'fonts', 'index.html')),
  patchFile(path.join(projectRoot, 'archive', 'v1.0.0', 'index.html')),
].some(Boolean);

if (patched) {
  console.log('Patched JSZip reference(s) to local vendor file.');
} else {
  console.log('No JSZip reference changes needed.');
}

