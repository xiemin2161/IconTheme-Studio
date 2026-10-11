/**
 * Build pipeline (tag-aware) / 带标签构建流水线。
 *
 * Purpose / 目标:
 * - Build font/symbol assets from `icon/` SVG sources. / 从 `icon/` SVG 源生成字体与 symbol 资源。
 * - Support tagged filenames (e.g. iconName·标签1·标签2.svg). / 支持带标签文件名（如 iconName·标签1·标签2.svg）。
 * - Ensure temporary renamed files are restored after build. / 构建后恢复临时重命名文件。
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始构建带标签的图标字体...\n');

// Build report summary (printed at the end). / 构建统计汇总（最后输出）。
const stats = {
  startTime: Date.now(),
  totalIcons: 0,
  taggedIcons: 0,
  generatedFiles: {
    fonts: 0,
    react: 0,
    vue: 0
  }
};

try {
  // Step 1: Clean previously generated files. / 步骤1：清理历史构建产物。
  console.log('1️⃣ 清理旧文件...');
  execSync('npm run clean', { stdio: 'inherit' });
  
  // Step 2: Process tagged icon filenames and generate tag metadata. / 步骤2：处理标签文件名并生成标签元数据。
  console.log('\n2️⃣ 处理带标签的图标...');
  execSync('npm run process-tags', { stdio: 'inherit' });
  
  // Step 3: Copy vendored JSZip for offline download feature. / 步骤3：复制本地 JSZip 以支持离线下载。
  console.log('\n3️⃣ 复制vendor文件...');
  execSync('npm run vendor:jszip', { stdio: 'inherit' });
  
  // Step 4: Generate font/symbol/css/json outputs via svgtofont. / 步骤4：通过 svgtofont 生成字体与资源文件。
  console.log('\n4️⃣ 生成字体文件...');
  execSync('npm run font', { stdio: 'inherit' });

  // Step 4.1: Restore custom index template (svgtofont website step overwrites it). / 步骤4.1：恢复自定义 index 模板（会被 svgtofont 覆盖）。
  console.log('\n   ↩️  恢复定制 index.html...');
  const templatePath = path.join(__dirname, 'index.template.html');
  const indexPath = path.join(__dirname, '../fonts/index.html');
  if (fs.existsSync(templatePath)) {
    fs.copyFileSync(templatePath, indexPath);
    console.log('   ✅ index.html 已从模板恢复');
  }

  // Step 4.2: Copy branding assets into fonts/assets for preview hosting. / 步骤4.2：复制品牌资源到 fonts/assets，便于预览站托管。
  console.log('\n   📁 同步预览资源 assets...');
  var assetsSrcDir = path.join(__dirname, '../assets');
  var assetsDestDir = path.join(__dirname, '../fonts/assets');
  fs.mkdirSync(assetsDestDir, { recursive: true });
  ['logo.svg', 'favicon.svg'].forEach(function(file) {
    var src = path.join(assetsSrcDir, file);
    var dest = path.join(assetsDestDir, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log('   ✅ 已同步: assets/' + file);
    }
  });
  
  // Step 5: Patch generated HTML for local JSZip reference and malformed tags. / 步骤5：修补生成 HTML（本地 JSZip 引用与异常标签）。
  console.log('\n5️⃣ 应用补丁...');
  execSync('npm run patch:jszip', { stdio: 'inherit' });
  
  // Step 6: Compile SCSS to runtime CSS. / 步骤6：编译 SCSS 为运行时 CSS。
  console.log('\n6️⃣ 编译SCSS...');
  execSync('npm run scss', { stdio: 'inherit' });
  
  // Step 7: Sync auxiliary JS files used by preview site. / 步骤7：同步预览站依赖的辅助 JS 文件。
  console.log('\n7️⃣ 创建额外的JS文件...');
  execSync('npm run create-js-files', { stdio: 'inherit' });
  
  // Step 8: Copy generated React component outputs. / 步骤8：复制生成的 React 组件产物。
  console.log('\n8️⃣ 复制React组件...');
  execSync('npm run copy', { stdio: 'inherit' });
  
  // Step 9: Build TypeScript declaration/runtime outputs for React package. / 步骤9：构建 React 包的 TS 声明与运行时代码。
  console.log('\n9️⃣ 构建TypeScript...');
  execSync('npm run build:react', { stdio: 'inherit' });
  
  // Step 10: Restore original icon filenames with tags. / 步骤10：恢复带标签的原始图标文件名。
  console.log('\n🔟 恢复原始图标文件名...');
  execSync('node scripts/process-tagged-icons.js restore', { stdio: 'inherit' });
  
  console.log('\n✅ 构建完成！');
  
  // Collect generated-file statistics. / 汇总生成文件统计信息。
  const fontsDir = path.join(__dirname, '../fonts');
  const reactDir = path.join(__dirname, '../fonts/react');
  const vueDir = path.join(__dirname, '../fonts/vue');
  
  // Count generated font-related files. / 统计字体相关产物数量。
  if (fs.existsSync(fontsDir)) {
    const fontFiles = fs.readdirSync(fontsDir).filter(f => 
      /\.(css|eot|svg|ttf|woff|woff2|json|less|scss|styl)$/.test(f) &&
      !['common.css', 'common.js', 'common.scss', 'download.js', 'index.html'].includes(f)
    );
    stats.generatedFiles.fonts = fontFiles.length;
  }
  
  // Count generated React component files. / 统计 React 组件产物数量。
  if (fs.existsSync(reactDir)) {
    const reactFiles = fs.readdirSync(reactDir);
    stats.generatedFiles.react = reactFiles.length;
  }
  
  // Count generated Vue component files. / 统计 Vue 组件产物数量。
  if (fs.existsSync(vueDir)) {
    const vueFiles = fs.readdirSync(vueDir);
    stats.generatedFiles.vue = vueFiles.length;
  }
  
  // Verify tag metadata exists, then print detailed report. / 校验标签元数据并输出详细报告。
  const tagsFile = path.join(__dirname, '../fonts/icon-tags.json');
  if (fs.existsSync(tagsFile)) {
    const tags = JSON.parse(fs.readFileSync(tagsFile, 'utf8'));
    const taggedIcons = Object.entries(tags).filter(([name, tags]) => tags !== null);
    stats.totalIcons = Object.keys(tags).length;
    stats.taggedIcons = taggedIcons.length;
    
    // Print tagged icon details first. / 先输出带标签图标详情。
    if (stats.taggedIcons > 0) {
      console.log('\n🏷️  带标签的图标详情:');
      console.log('─'.repeat(30));
      taggedIcons.forEach(([name, tags]) => {
        console.log(`   📌 ${name}: ${tags.join(', ')}`);
      });
    }
    
    // Print build summary report. / 再输出构建汇总报告。
    console.log('\n📊 构建统计报告:');
    console.log('═'.repeat(50));
    console.log(`⏱️  构建耗时: ${((Date.now() - stats.startTime) / 1000).toFixed(2)}秒`);
    console.log(`📁 总图标数: ${stats.totalIcons}`);
    console.log(`🏷️  带标签图标数: ${stats.taggedIcons}`);
    console.log(`📄 生成的字体文件: ${stats.generatedFiles.fonts}`);
    console.log(`⚛️  生成的React组件: ${stats.generatedFiles.react}`);
    console.log(`🟢 生成的Vue组件: ${stats.generatedFiles.vue}`)
    
    console.log('\n📦 生成的主要文件:');
    console.log('─'.repeat(30));
    const mainFiles = [
      'its-icon.css', 'its-icon.ttf', 'its-icon.woff2', 
      'its-icon.json', 'its-icon.symbol.svg'
    ];
    mainFiles.forEach(file => {
      const filePath = path.join(fontsDir, file);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const size = (stats.size / 1024).toFixed(2);
        console.log(`   📄 ${file} (${size} KB)`);
      }
    });
    
    console.log('\n🎉 构建成功完成！所有图标文件已恢复原始名称。');
    console.log('═'.repeat(50));
  } else {
    console.log('\n⚠️  警告: 标签文件不存在');
  }
  
} catch (error) {
  console.error('\n❌ 构建失败:', error.message);
  
  // Best-effort restore: even if build fails, revert temporary filename changes. / 尽力恢复：即使失败也回滚临时重命名。
  try {
    console.log('\n🔄 尝试恢复图标文件名...');
    execSync('node scripts/process-tagged-icons.js restore', { stdio: 'inherit' });
  } catch (restoreError) {
    console.error('恢复文件名失败:', restoreError.message);
  }
  
  process.exit(1);
}