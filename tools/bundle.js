const path = require('path');

const { rollupBuild } = require('./rollup-build');
const { clean } = require('./clean');

const resolve = require('rollup-plugin-node-resolve');
const typescript = require('rollup-plugin-typescript2');


const config = {
  inputOptions: {
    treeshake: true,
    input: 'src/index.ts',
    plugins: [
      typescript({ 
        tsconfig: 'src/tsconfig.json',
        useTsconfigDeclarationDir: false,
        check: false,
        dest: '.tmp',
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
    file: 'dist/esm5/custom-element-ts.js',
    format: 'es',
    dest: '.tmp'
  }
};

Promise.all([ clean('dist') ])
  .then(() => rollupBuild(config))


