

const { config, ELEMENT_NAME } = require('./rollup-config');
const { clean, rollupGenerate, inlineSources, } = require('@ngx-devtools/common');

const DEST_PATH = 'dist';
const SRC_PATH = `demos/${ELEMENT_NAME}/**/*.tsx`;
const SRC_TMP_PATH = `.tmp`;

Promise.all([ clean(DEST_PATH), clean(SRC_TMP_PATH) ])
  .then(() => inlineSources(SRC_PATH, SRC_TMP_PATH))
  .then(() => rollupGenerate(config));
