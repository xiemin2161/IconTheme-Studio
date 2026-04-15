const fs = require('fs');
const path = require('path');

// 读取图标目录
const iconDir = path.join(__dirname, '../icon');
const fontsDir = path.join(__dirname, '../fonts');

// 存储标签信息的对象
const iconTags = {};
// 存储需要恢复的文件名映射
const fileNameMapping = {};

// 文件名标签分隔符
// 旧格式: iconName@标签1#标签2.svg
// 新格式: iconName·标签1·标签2.svg
const TAG_SEPARATOR = '·';

// 处理图标文件
function processIcons() {
  const files = fs.readdirSync(iconDir);
  let processedCount = 0;
  let taggedCount = 0;
  
  console.log('📁 扫描图标文件...');
  
  files.forEach(file => {
    if (file.endsWith('.svg')) {
      const fullPath = path.join(iconDir, file);
      const nameWithoutExt = file.replace('.svg', '');
      
      // 检查是否包含标签
      if (nameWithoutExt.includes(TAG_SEPARATOR)) {
        const parts = nameWithoutExt.split(TAG_SEPARATOR).filter(part => part.trim().length > 0);
        const iconName = parts[0];
        const tags = parts.slice(1).filter(tag => tag.trim().length > 0);
        
        // 生成新的文件名（纯英文）
        const newFileName = iconName + '.svg';
        const newPath = path.join(iconDir, newFileName);
        
        // 保存文件名映射关系，用于后续恢复
        fileNameMapping[newFileName] = file;
        
        // 如果新文件名不存在，重命名文件
        if (!fs.existsSync(newPath)) {
          console.log(`🔄 处理: ${file} -> ${newFileName}`);
          fs.renameSync(fullPath, newPath);
          processedCount++;
        } else {
          console.log(`⚠️  跳过重命名（文件已存在）: ${newFileName}`);
          // 删除带标签的原文件
          fs.unlinkSync(fullPath);
        }
        
        // 保存标签信息
        iconTags[iconName] = tags;
        taggedCount++;
      } else {
        // 没有标签的图标，标记为无标签
        iconTags[nameWithoutExt] = null;
      }
    }
  });
  
  // 保存标签信息到JSON文件
  const tagsFilePath = path.join(fontsDir, 'icon-tags.json');
  fs.writeFileSync(tagsFilePath, JSON.stringify(iconTags, null, 2), 'utf8');
  
  // 保存文件名映射到JSON文件，用于后续恢复
  const mappingFilePath = path.join(fontsDir, 'filename-mapping.json');
  fs.writeFileSync(mappingFilePath, JSON.stringify(fileNameMapping, null, 2), 'utf8');
  
  console.log(`✅ 标签信息已保存到: ${tagsFilePath}`);
  console.log(`📋 文件映射已保存到: ${mappingFilePath}`);
  
  console.log('\n📊 处理统计:');
  console.log(`   总图标数: ${Object.keys(iconTags).length}`);
  console.log(`   带标签图标数: ${taggedCount}`);
  console.log(`   处理的文件数: ${processedCount}`);
  
  if (taggedCount > 0) {
    console.log('\n🏷️  带标签的图标:');
    Object.entries(iconTags).forEach(([iconName, tags]) => {
      if (tags) {
        console.log(`   ${iconName}: ${tags.join(', ')}`);
      }
    });
  }
}

// 恢复原始文件名
function restoreOriginalFileNames() {
  const mappingFilePath = path.join(fontsDir, 'filename-mapping.json');
  
  if (!fs.existsSync(mappingFilePath)) {
    console.log('ℹ️  没有找到文件映射，跳过恢复步骤');
    return;
  }
  
  const mapping = JSON.parse(fs.readFileSync(mappingFilePath, 'utf8'));
  let restoredCount = 0;
  
  console.log('\n🔄 恢复原始文件名...');
  
  Object.entries(mapping).forEach(([cleanFileName, originalFileName]) => {
    const cleanPath = path.join(iconDir, cleanFileName);
    const originalPath = path.join(iconDir, originalFileName);
    
    if (fs.existsSync(cleanPath) && !fs.existsSync(originalPath)) {
      fs.renameSync(cleanPath, originalPath);
      console.log(`   ${cleanFileName} -> ${originalFileName}`);
      restoredCount++;
    }
  });
  
  console.log(`✅ 已恢复 ${restoredCount} 个文件名`);
  
  // 清理映射文件
  fs.unlinkSync(mappingFilePath);
  console.log('🗑️  已清理临时映射文件');
}

// 根据命令行参数决定执行哪个操作
const command = process.argv[2];

if (command === 'restore') {
  restoreOriginalFileNames();
} else {
  // 执行处理
  processIcons();
}