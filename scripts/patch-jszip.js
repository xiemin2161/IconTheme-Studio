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
    // If the generator removed the tag, re-insert it before common.js
    next = next.replace(
      '<script src="common.js"></script>',
      `${localLine}\n  <script src="common.js"></script>`,
    );
  }

  // Fix malformed download button tag produced by wrong encoding/editor
  // e.g. <a id="download-btn" title="下载图标�?>
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

