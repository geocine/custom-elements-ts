const path = require('path');

const typescript = require('rollup-plugin-typescript2');
const resolve = require('rollup-plugin-node-resolve');

const { uglify } = require('./rollup-plugin-uglify');
const { isProcess } = require('./check-args');

const ELEMEMT_NAME = 'counter-element';
const DEST_PATH = 'dist';
const INPUT_PATH =  path.join('.tmp', 'index.ts');

const prodModeParams = [ '--prod',  '--prod=true',  '--prod true'  ];

const config = {
  inputOptions: {
    treeshake: true,
    input: INPUT_PATH,
    plugins: [
      typescript({ 
        useTsconfigDeclarationDir: true,
        check: false,
        cacheRoot: path.join(path.resolve(), 'node_modules/.tmp/.rts2_cache')
      }),
      resolve()
    ],
    onwarn (warning) {
      if (warning.code === 'THIS_IS_UNDEFINED') { return; }
      console.log("Rollup warning: ", warning.message);
    }
  },
  outputOptions: {
    sourcemap: true,
    exports: 'named',
    name: ELEMEMT_NAME,
    file: `${DEST_PATH}/${ELEMEMT_NAME}.umd.js`,
    format: 'umd'
  }
};

if (isProcess(prodModeParams)) {
  const options = {
    mangle: { keep_fnames: true }
  };
  config.inputOptions.plugins.push(uglify(options));
}

exports.config = config;