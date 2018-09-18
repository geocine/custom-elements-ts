const { join } = require('path');

const { DevServer } = require('@ngx-devtools/server');
const { inlineSources, mkdirp, rollupGenerate, copyFileAsync, clean, watcher } = require('@ngx-devtools/common');

const { config, ELEMENT_NAME } = require('./rollup-config');

const DEST_PATH = 'dist';
const SRC_PATH = `demos/${ELEMENT_NAME}/**/*.tsx`;
const SRC_TMP_PATH = `.tmp`;

const copy = () => {
  mkdirp(DEST_PATH);
  return copyFileAsync(`demos/${ELEMENT_NAME}/index.html`, join(DEST_PATH, 'index.html'));
};

const fileWatcher = () => {
  return watcher({
    file: [ 'demos', 'src' ],
    onClientFileChanged: async file => {
      await inlineSources(SRC_PATH, SRC_TMP_PATH)
      await rollupGenerate(config)
    }
  })
}

Promise.all([ clean(DEST_PATH), clean(SRC_TMP_PATH) ])
  .then(() => Promise.all([ inlineSources(SRC_PATH, SRC_TMP_PATH), copy() ]))
  .then(() => Promise.all([ rollupGenerate(config), DevServer.start(), fileWatcher() ]));