const sass = require('node-sass');

const { promisify } = require('util');
const { readFileSync, writeFile, readFile, existsSync, mkdirSync } = require('fs');
const { dirname, join, sep, resolve } = require('path');

const { getFiles } = require('./files');

const writeFileAsync = promisify(writeFile);
const readFileAsync = promisify(readFile);

const mkdirp = (directory) => {
  const dirPath = resolve(directory).replace(/\/$/, '').split(sep);
  for (let i = 1; i <= dirPath.length; i++) {
    const segment = dirPath.slice(0, i).join(sep);
    if (!existsSync(segment) && segment.length > 0) {
      mkdirSync(segment);
    }
  }
};

const inlineTemplate = () => {
  return (content, urlResolver) => {
    return content.replace(/templateUrl:\s*'([^']+?\.html)'/g, function (m, templateUrl) {
      const templateFile = urlResolver(templateUrl);
      const templateContent = readFileSync(templateFile, 'utf8');
      const shortenedTemplate = templateContent.replace(/([\n\r]\s*)+/gm, ' ').replace(/"/g, '\\"');
      return `template: "${shortenedTemplate}"`;
    });
  }
};

const buildSass = (content, sourceFile) => {
  try {
    return sourceFile.endsWith('.scss') ? 
      sass.renderSync({ data: content, file: sourceFile, outputStyle: 'compressed' })
        .css.toString() : content;
  } catch (e) {
    console.error('\x1b[41m');
    console.error('at ' + sourceFile + ':' + e.line + ":" + e.column);
    console.error(e.formatted);
    console.error('\x1b[0m');
    return "";
  }
};

const getContent = (styleUrl, urlResolver) => {
  const styleFile = urlResolver(styleUrl);
  const originContent = readFileSync(styleFile, 'utf8');
  const styleContent = buildSass(originContent, styleFile);
  return styleContent
    .replace(/([\n\r]\s*)+/gm, ' ')
    .replace(/"/g, '\\"');
};

const inlineStyle = (content, urlResolver) => {
  return content.replace(/styleUrls\s*:\s*(\[[\s\S]*?\])/gm,  (m, styleUrls) => {
    const urls = eval(styleUrls);
    m = m.replace('styleUrls', 'styles');
    urls.forEach(styleUrl => m = m.replace(styleUrl, getContent(styleUrl, urlResolver)));
    return m;
  });
};

const inlineResourcesFromString = (content, urlResolver) => {
  return [ inlineTemplate(), inlineStyle ].reduce((content, fn) => fn(content, urlResolver), content);
};

const inlineSources = (src, dest) => {
  const files = getFiles(src).join(',').split(',');
  return Promise.all(files.map(file => {
    const destPath = file.replace('src', dest);
    return readFileAsync(file, 'utf8')
      .then(content => inlineResourcesFromString(content, url => join(dirname(file), url)))
      .then(content => {
        mkdirp(dirname(destPath))
        return writeFileAsync(destPath, content);
      });
  }))
};

exports.inlineSources = inlineSources;
