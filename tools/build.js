
const { rollupBuild } = require('./rollup-build');
const { config } = require('./rollup-config');
const { clean } = require('./clean');
const { inlineSources } = require('./inline-sources');

const DEST_PATH = 'dist';
const TMP_PATH = '.tmp';
const SRC_PATH = 'demos/**/*.ts';

Promise.all([ clean(DEST_PATH), clean(TMP_PATH) ])
  .then(() => inlineSources(SRC_PATH, TMP_PATH))
  .then(() => rollupBuild(config));