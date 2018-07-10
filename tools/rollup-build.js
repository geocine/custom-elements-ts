
const { dirname, basename } = require('path');

const { writeFileAsync } = require('./files');
const { mkdirp } = require('./mkdrip');

const { rollup } = require('rollup');

const rollupBuild = ({ inputOptions, outputOptions }) => {
  return rollup(inputOptions)
  .then(bundle => bundle.generate(outputOptions))
  .then(({ code, map }) => {
    mkdirp(dirname(outputOptions.file));
    return Promise.all([ 
      writeFileAsync(outputOptions.file, code + `\n//# sourceMappingURL=${basename(outputOptions.file)}.map`),
      writeFileAsync(outputOptions.file + '.map', map.toString())
    ])
  });
};

exports.rollupBuild = rollupBuild;
