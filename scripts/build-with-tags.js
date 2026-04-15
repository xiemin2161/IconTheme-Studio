const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 开始构建带标签的图标字体...\n');

// 统计信息
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
  // 1. 清理旧文件（保留标签文件）
  console.log('1️⃣ 清理旧文件...');
  execSync('npm run clean', { stdio: 'inherit' });
  
  // 2. 处理带标签的图标
  console.log('\n2️⃣ 处理带标签的图标...');
  execSync('npm run process-tags', { stdio: 'inherit' });
  
  // 3. 复制vendor文件
  console.log('\n3️⃣ 复制vendor文件...');
  execSync('npm run vendor:jszip', { stdio: 'inherit' });
  
  // 4. 生成字体文件
  console.log('\n4️⃣ 生成字体文件...');
  execSync('npm run font', { stdio: 'inherit' });

  // 4.1 恢复定制的 index.html（svgtofont --website 会覆盖它）
  console.log('\n   ↩️  恢复定制 index.html...');
  const templatePath = path.join(__dirname, 'index.template.html');
  const indexPath = path.join(__dirname, '../fonts/index.html');
  if (fs.existsSync(templatePath)) {
    fs.copyFileSync(templatePath, indexPath);
    console.log('   ✅ index.html 已从模板恢复');
  }
  
  // 5. 应用补丁
  console.log('\n5️⃣ 应用补丁...');
  execSync('npm run patch:jszip', { stdio: 'inherit' });
  
  // 6. 编译SCSS
  console.log('\n6️⃣ 编译SCSS...');
  execSync('npm run scss', { stdio: 'inherit' });
  
  // 7. 创建额外的JS文件
  console.log('\n7️⃣ 创建额外的JS文件...');
  execSync('npm run create-js-files', { stdio: 'inherit' });
  
  // 8. 复制React组件
  console.log('\n8️⃣ 复制React组件...');
  execSync('npm run copy', { stdio: 'inherit' });
  
  // 9. 构建TypeScript
  console.log('\n9️⃣ 构建TypeScript...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // 10. 恢复原始文件名
  console.log('\n🔟 恢复原始图标文件名...');
  execSync('node scripts/process-tagged-icons.js restore', { stdio: 'inherit' });
  
  console.log('\n✅ 构建完成！');
  
  // 统计生成的文件
  const fontsDir = path.join(__dirname, '../fonts');
  const reactDir = path.join(__dirname, '../fonts/react');
  const vueDir = path.join(__dirname, '../fonts/vue');
  
  // 统计字体文件
  if (fs.existsSync(fontsDir)) {
    const fontFiles = fs.readdirSync(fontsDir).filter(f => 
      /\.(css|eot|svg|ttf|woff|woff2|json|less|scss|styl)$/.test(f) &&
      !['common.css', 'common.js', 'common.scss', 'download.js', 'index.html'].includes(f)
    );
    stats.generatedFiles.fonts = fontFiles.length;
  }
  
  // 统计React组件
  if (fs.existsSync(reactDir)) {
    const reactFiles = fs.readdirSync(reactDir);
    stats.generatedFiles.react = reactFiles.length;
  }
  
  // 统计Vue组件
  if (fs.existsSync(vueDir)) {
    const vueFiles = fs.readdirSync(vueDir);
    stats.generatedFiles.vue = vueFiles.length;
  }
  
  // 验证标签文件是否存在
  const tagsFile = path.join(__dirname, '../fonts/icon-tags.json');
  if (fs.existsSync(tagsFile)) {
    const tags = JSON.parse(fs.readFileSync(tagsFile, 'utf8'));
    const taggedIcons = Object.entries(tags).filter(([name, tags]) => tags !== null);
    stats.totalIcons = Object.keys(tags).length;
    stats.taggedIcons = taggedIcons.length;
    
    // 先显示带标签的图标详情
    if (stats.taggedIcons > 0) {
      console.log('\n🏷️  带标签的图标详情:');
      console.log('─'.repeat(30));
      taggedIcons.forEach(([name, tags]) => {
        console.log(`   📌 ${name}: ${tags.join(', ')}`);
      });
    }
    
    // 再显示构建统计报告
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
  
  // 尝试恢复文件名，即使构建失败
  try {
    console.log('\n🔄 尝试恢复图标文件名...');
    execSync('node scripts/process-tagged-icons.js restore', { stdio: 'inherit' });
  } catch (restoreError) {
    console.error('恢复文件名失败:', restoreError.message);
  }
  
  process.exit(1);
}