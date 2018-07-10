const path = require('path');
const fs = require('fs');

const { rmdirAsync, lstatAsync, unlinkAsync, readdirAsync } = require('./files');
const { startAsync, doneAsync } = require('./info');

const clean = async (dir) => {
  if (fs.existsSync(dir)) {
    const files = await readdirAsync(dir);
    await Promise.all(files.map(async (file) => {
      const p = path.join(dir, file);
      const stat = await lstatAsync(p);
      if (stat.isDirectory()) {
        await clean(p);
      } else {
        await startAsync('clean', `Removed file ${p}`)
          .then(startTime => unlinkAsync(p).then(() => Promise.resolve(startTime)))
          .then(startTime => doneAsync('clean', `Removed file ${p}`, startTime));
      }
    }));
    await startAsync('clean', `Removed dir ${dir}`) 
      .then(startTime => rmdirAsync(dir).then(() => Promise.resolve(startTime)))
      .then(startTime => doneAsync('clean', `Removed dir ${dir}`, startTime));
  }
};

exports.clean = clean;