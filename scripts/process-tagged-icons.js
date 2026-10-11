/**
 * Tagged icon filename processor / 带标签图标文件名处理器。
 *
 * Modes / 模式:
 * - default: extract tags from `icon/` filenames and write metadata files
 *   默认：从 `icon/` 文件名提取标签并写入元数据文件
 * - restore: restore original tagged filenames after build
 *   恢复：构建后恢复原始带标签文件名
 */
const fs = require('fs');
const path = require('path');

// Input and output directories. / 输入与输出目录。
const iconDir = path.join(__dirname, '../icon');
const fontsDir = path.join(__dirname, '../fonts');

// In-memory metadata cache. / 内存中的标签元数据缓存。
const iconTags = {};
// Temporary filename mapping for restore step. / 恢复步骤使用的临时文件名映射。
const fileNameMapping = {};

// Filename tag separator. / 文件名标签分隔符。
// Legacy format: iconName@标签1#标签2.svg / 历史格式：iconName@标签1#标签2.svg
// Current format: iconName·标签1·标签2.svg / 当前格式：iconName·标签1·标签2.svg
const TAG_SEPARATOR = '·';

// Scan icon files, extract tags, and generate metadata. / 扫描图标文件、提取标签并生成元数据。
function processIcons() {
  const files = fs.readdirSync(iconDir);
  let processedCount = 0;
  let taggedCount = 0;
  
  console.log('📁 扫描图标文件...');
  
  files.forEach(file => {
    if (file.endsWith('.svg')) {
      const fullPath = path.join(iconDir, file);
      const nameWithoutExt = file.replace('.svg', '');
      
      // Split tag-style filename into icon name + tags. / 将标签式文件名拆分为图标名与标签列表。
      if (nameWithoutExt.includes(TAG_SEPARATOR)) {
        const parts = nameWithoutExt.split(TAG_SEPARATOR).filter(part => part.trim().length > 0);
        const iconName = parts[0];
        const tags = parts.slice(1).filter(tag => tag.trim().length > 0);
        
        // Temporary build filename (without tags). / 构建阶段临时文件名（不带标签）。
        const newFileName = iconName + '.svg';
        const newPath = path.join(iconDir, newFileName);
        
        // Persist mapping to recover original tagged filename later. / 记录映射，供后续恢复原始带标签文件名。
        fileNameMapping[newFileName] = file;
        
        // Rename only when target doesn't exist; otherwise remove duplicate tagged file. / 仅在目标不存在时重命名，否则删除重复的带标签文件。
        if (!fs.existsSync(newPath)) {
          console.log(`🔄 处理: ${file} -> ${newFileName}`);
          fs.renameSync(fullPath, newPath);
          processedCount++;
        } else {
          console.log(`⚠️  跳过重命名（文件已存在）: ${newFileName}`);
          // 删除带标签的原文件
          fs.unlinkSync(fullPath);
        }
        
        // Save tag metadata for this icon. / 保存当前图标的标签元数据。
        iconTags[iconName] = tags;
        taggedCount++;
      } else {
        // Icon without tags: keep key with null value. / 无标签图标：以 null 记录键值。
        iconTags[nameWithoutExt] = null;
      }
    }
  });
  
  // Write tag metadata file. / 写入标签元数据文件。
  const tagsFilePath = path.join(fontsDir, 'icon-tags.json');
  fs.writeFileSync(tagsFilePath, JSON.stringify(iconTags, null, 2), 'utf8');
  
  // Write restore mapping file. / 写入恢复映射文件。
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

// Restore original tagged filenames after build. / 构建后恢复原始带标签文件名。
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
  
  // Remove temporary mapping file after restore. / 恢复完成后删除临时映射文件。
  fs.unlinkSync(mappingFilePath);
  console.log('🗑️  已清理临时映射文件');
}

// Route by command argument. / 根据命令参数路由执行模式。
const command = process.argv[2];

if (command === 'restore') {
  restoreOriginalFileNames();
} else {
  // Default mode: process tags. / 默认模式：执行标签处理。
  processIcons();
}