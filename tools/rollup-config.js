const path = require('path');

const typescript = require('rollup-plugin-typescript2');
const resolve = require('rollup-plugin-node-resolve');

const { isProcess, rollupPluginUglify } = require('@ngx-devtools/common');
const { existsSync } = require('fs');

const ELEMENT_NAME = process.argv[2];
const DEST_PATH = 'dist';

const prodModeParams = [ '--prod',  '--prod=true',  '--prod true'  ];

const ELEMENT_PATH = `${ELEMENT_NAME}/index.tsx`;
const INPUT_PATH =  path.join('.tmp', ELEMENT_PATH);

if(ELEMENT_NAME == undefined){
  console.log('specify which element to start');
  console.log(' ↳  eg. npm start element-name');
  process.exit();
}

if(!existsSync(`demos/${ELEMENT_PATH}`)){
  console.log('element does not exist');
  process.exit();
}

const toPascalCase = (text) => {
  return text.replace(/-\w/g, m => m[1].toUpperCase())
    .replace(/^\w/, c => c.toUpperCase());
}

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
    name: toPascalCase(ELEMENT_NAME),
    file: `${DEST_PATH}/${ELEMENT_NAME}.umd.js`,
    format: 'umd'
  }
};

if (isProcess(prodModeParams)) {
  const options = {
    mangle: { keep_fnames: true }
  };
  config.inputOptions.plugins.push(rollupPluginUglify(options));
}

exports.config = config;
exports.ELEMENT_NAME = ELEMENT_NAME;