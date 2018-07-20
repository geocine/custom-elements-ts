
const { rollupBuild } = require('./rollup-build');
const { config, ELEMENT_NAME } = require('./rollup-config');
const { clean } = require('./clean');
const { inlineSources } = require('./inline-sources');

const DEST_PATH = 'dist';
const SRC_PATH = `demos/${ELEMENT_NAME}/**/*.ts`;
const SRC_TMP_PATH = `.tmp`;

Promise.all([ clean(DEST_PATH), clean(SRC_TMP_PATH) ])
  .then(() => inlineSources(SRC_PATH, SRC_TMP_PATH))
  .then(() => rollupBuild(config));