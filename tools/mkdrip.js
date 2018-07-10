const { resolve, sep } = require('path');
const { mkdirSync, existsSync } = require('fs');

const mkdirp = (directory) => {
  const dirPath = resolve(directory).replace(/\/$/, '').split(sep);
  for (let i = 1; i <= dirPath.length; i++) {
    const segment = dirPath.slice(0, i).join(sep);
    if (!existsSync(segment) && segment.length > 0) {
      mkdirSync(segment);
    }
  }
};

exports.mkdirp = mkdirp;