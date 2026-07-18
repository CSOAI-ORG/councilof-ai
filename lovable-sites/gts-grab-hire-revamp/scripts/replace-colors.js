// Script to replace gts-green with gts-success across all files
// This will be executed to fix the color system

const fs = require('fs');
const path = require('path');

const findAndReplace = (dir, extension) => {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findAndReplace(filePath, extension);
    } else if (file.endsWith(extension)) {
      let content = fs.readFileSync(filePath, 'utf8');
      const originalContent = content;
      
      // Replace all instances of gts-green with gts-success
      content = content.replace(/gts-green/g, 'gts-success');
      
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
      }
    }
  }
};

// Replace in all TypeScript/React files
findAndReplace('./src', '.tsx');
findAndReplace('./src', '.ts');

console.log('Color replacement complete!');