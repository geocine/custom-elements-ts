
const { join } = require('path');

const { serverStart } = require('@ngx-devtools/server');
const { inlineSources, mkdirp, rollupGenerate, copyFileAsync, clean } = require('@ngx-devtools/common');

const { config, ELEMENT_NAME } = require('./rollup-config');

const DEST_PATH = 'dist';
const SRC_PATH = 'demos/**/*.ts';
const SRC_TMP_PATH = '.tmp';

const copy = () => {
  mkdirp(DEST_PATH);
  return copyFileAsync(`demos/${ELEMENT_NAME}/index.html`, join(DEST_PATH, 'index.html'));
};

Promise.all([ clean(DEST_PATH), clean(SRC_TMP_PATH) ])
  .then(() => inlineSources(SRC_PATH, SRC_TMP_PATH))
  .then(() => Promise.all([ copy(), rollupGenerate(config), serverStart() ]));