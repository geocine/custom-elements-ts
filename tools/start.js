
const { join } = require('path');

const { serverStart } = require('@ngx-devtools/server');

const { inlineSources } = require('./inline-sources');
const { mkdirp } = require('./mkdrip');
const { copyFileAsync } = require('./files');
const { rollupBuild } = require('./rollup-build'); 
const { config } = require('./rollup-config');
const { clean } = require('./clean');

const DEST_PATH = 'dist';
const SRC_PATH = 'src/**/*.ts';
const SRC_TMP_PATH = '.tmp';

const copy = () => {
  mkdirp(DEST_PATH);
  return copyFileAsync('src/index.html', join(DEST_PATH, 'index.html'));
};

Promise.all([ clean(DEST_PATH), clean(SRC_TMP_PATH) ])
  .then(() => inlineSources(SRC_PATH, SRC_TMP_PATH))
  .then(() => Promise.all([ copy(), rollupBuild(config), serverStart() ]));