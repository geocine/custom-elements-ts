const { join } = require('path');
const express = require('express');
const { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, watch } = require('fs');
const rollup = require('rollup');
const rimraf = require('rimraf');
const glob = require('glob');
const { config, ELEMENT_NAME } = require('./rollup-config');

const DEST_PATH = 'dist';
const SRC_PATH = `demos/${ELEMENT_NAME}/**/*.ts`;
const SRC_TMP_PATH = `.tmp`;

// Simple dev server
class DevServer {
  static start() {
    const app = express();
    const port = 3000;
    
    app.use(express.static(DEST_PATH));
    
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  }
}

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
    const relativePath = file.replace('demos/', '');
    const destFile = join(destPath, relativePath);
    const destDir = join(destPath, relativePath.split('/').slice(0, -1).join('/'));
    
    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true });
    }
    
    // Inline templateUrl and styleUrl references
    content = inlineTemplates(content, file.split('/').slice(0, -1).join('/'));
    
    writeFileSync(destFile, content);
  }
}

function inlineTemplates(content, basePath) {
  // Match templateUrl: './file.html'
  const templateUrlRegex = /templateUrl:\s*['"`]([^'"`]+)['"`]/g;
  content = content.replace(templateUrlRegex, (match, filePath) => {
    const fullPath = join(basePath, filePath);
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
    const fullPath = join(basePath, filePath);
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

const copy = () => {
  if (!existsSync(DEST_PATH)) {
    mkdirSync(DEST_PATH, { recursive: true });
  }
  
  // Copy polyfills to dist
  const polyfillsDir = join(DEST_PATH, 'node_modules', '@webcomponents', 'custom-elements');
  if (!existsSync(polyfillsDir)) {
    mkdirSync(polyfillsDir, { recursive: true });
  }
  
  const srcDir = join(polyfillsDir, 'src');
  if (!existsSync(srcDir)) {
    mkdirSync(srcDir, { recursive: true });
  }
  
  // Copy native-shim.js
  const nativeShimSrc = join('node_modules', '@webcomponents', 'custom-elements', 'src', 'native-shim.js');
  const nativeShimDest = join(polyfillsDir, 'src', 'native-shim.js');
  if (existsSync(nativeShimSrc)) {
    copyFileSync(nativeShimSrc, nativeShimDest);
  }
  
  // Copy custom-elements.min.js
  const customElementsSrc = join('node_modules', '@webcomponents', 'custom-elements', 'custom-elements.min.js');
  const customElementsDest = join(polyfillsDir, 'custom-elements.min.js');
  if (existsSync(customElementsSrc)) {
    copyFileSync(customElementsSrc, customElementsDest);
  }
  
  return copyFileSync(`demos/${ELEMENT_NAME}/index.html`, join(DEST_PATH, 'index.html'));
};

const fileWatcher = () => {
  // Watch src and demos directories
  watch('src', { recursive: true }, async (eventType, filename) => {
    if (filename && filename.endsWith('.ts')) {
      console.log(`File changed: ${filename}`);
      await inlineSources(SRC_PATH, SRC_TMP_PATH);
      await rollupGenerate(config);
    }
  });
  
  watch('demos', { recursive: true }, async (eventType, filename) => {
    if (filename && filename.endsWith('.ts')) {
      console.log(`File changed: ${filename}`);
      await inlineSources(SRC_PATH, SRC_TMP_PATH);
      await rollupGenerate(config);
    }
  });
}

Promise.all([clean(DEST_PATH), clean(SRC_TMP_PATH)])
  .then(() => Promise.all([inlineSources(SRC_PATH, SRC_TMP_PATH), copy()]))
  .then(() => {
    rollupGenerate(config);
    DevServer.start();
    fileWatcher();
  })
  .catch(err => {
    console.error('Start failed:', err);
    process.exit(1);
  });