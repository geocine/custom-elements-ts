const { execSync } = require('child_process');
const { existsSync, mkdirSync } = require('fs');
const path = require('path');
const { config, ELEMENT_NAME } = require('./rollup-config');
const rollup = require('rollup');
const rimraf = require('rimraf');
const { copyFile } = require('fs').promises;
const glob = require('glob');
const { readFileSync, writeFileSync } = require('fs');

const DEST_PATH = 'dist';
const SRC_PATH = `demos/${ELEMENT_NAME}/**/*.ts`;
const SRC_TMP_PATH = `.tmp`;

async function clean(dir) {
  return new Promise((resolve, reject) => {
    rimraf(dir, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function inlineSources(srcPattern, destPath) {
  const files = glob.sync(srcPattern);
  
  if (!existsSync(destPath)) {
    mkdirSync(destPath, { recursive: true });
  }
  
  for (const file of files) {
    let content = readFileSync(file, 'utf-8');
    const relativePath = path.relative('demos', file);
    const destFile = path.join(destPath, relativePath);
    const destDir = path.dirname(destFile);
    
    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true });
    }
    
    // Inline templateUrl and styleUrl references
    content = inlineTemplates(content, path.dirname(file));
    
    writeFileSync(destFile, content);
  }
}

function inlineTemplates(content, basePath) {
  // Match templateUrl: './file.html'
  const templateUrlRegex = /templateUrl:\s*['"`]([^'"`]+)['"`]/g;
  content = content.replace(templateUrlRegex, (match, filePath) => {
    const fullPath = path.join(basePath, filePath);
    if (existsSync(fullPath)) {
      const template = readFileSync(fullPath, 'utf-8')
        .replace(/`/g, '\\`')
        .replace(/\$/g, '\\$');
      return `template: \`${template}\``;
    }
    return match;
  });
  
  // Match styleUrl: './file.scss' or './file.css'
  const styleUrlRegex = /styleUrl:\s*['"`]([^'"`]+)['"`]/g;
  content = content.replace(styleUrlRegex, (match, filePath) => {
    const fullPath = path.join(basePath, filePath);
    if (existsSync(fullPath)) {
      let style = readFileSync(fullPath, 'utf-8');
      // For SCSS files, we'd normally compile them, but for now just use as CSS
      style = style.replace(/`/g, '\\`').replace(/\$/g, '\\$');
      return `style: \`${style}\``;
    }
    return match;
  });
  
  return content;
}

async function rollupGenerate(config) {
  const bundle = await rollup.rollup(config.inputOptions);
  await bundle.write(config.outputOptions);
}

Promise.all([clean(DEST_PATH), clean(SRC_TMP_PATH)])
  .then(() => inlineSources(SRC_PATH, SRC_TMP_PATH))
  .then(() => rollupGenerate(config))
  .catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
  });