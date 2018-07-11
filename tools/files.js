const fs = require('fs');
const path = require('path');

const promisify = require('util').promisify;

const walk = ({ dir, isRecursive = true, includes = [] }) => {
  let results = [];
  const rootDir = path.resolve(dir);
  const files = fs.readdirSync(rootDir);
  files.forEach(list => {
    list = path.join(rootDir, list)
    const stat = fs.statSync(list);
    if (stat.isDirectory() && isRecursive) {
      results = results.concat(walk(
        { dir: list, isRecursive: isRecursive, includes: includes }
      ));
    } 
    if (stat.isFile()) {
      if (includes.length <= 0) { 
        results.push(list);
      } else if (includes.includes(path.extname(list))) {
        results.push(list); 
      }
    }
  });
  return results;
};

const getDir = src => {
  return (Array.isArray(src) ? src : [ src ])
    .map(file => {
      return { 
        dir: path.dirname(file).replace('/**', ''),
        isRecursive: file.includes('**'),
        includes: [ path.extname(file) ]
      };
    })
};

const walkSync = ({ dir, isRecursive = true, includes = [] }) => {
  return walk({ dir, isRecursive, includes});
};

const getFiles = src => {
  return getDir(src).map(directory => walkSync({ 
    dir: directory.dir, 
    isRecursive: directory.isRecursive, 
    includes: directory.includes 
  }));
};

const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);
const copyFileAsync = promisify(fs.copyFile);
const rmdirAsync = promisify(fs.rmdir);
const lstatAsync = promisify(fs.lstat);
const unlinkAsync = promisify(fs.unlink);
const readdirAsync = promisify(fs.readdir);
const renameAsync = promisify(fs.rename);

exports.getFiles = getFiles;
exports.rmdirAsync = rmdirAsync;
exports.lstatAsync = lstatAsync;
exports.unlinkAsync = unlinkAsync;
exports.readdirAsync = readdirAsync;
exports.writeFileAsync = writeFileAsync;
exports.readFileAsync = readFileAsync;
exports.copyFileAsync = copyFileAsync;
exports.renameAsync = renameAsync;