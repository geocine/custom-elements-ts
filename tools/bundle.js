const { buildCopyPackageFile, rollupBuild, clean, copyReadMe, renameAsync, globFiles } =  require('@ngx-devtools/common');
const path = require('path');

const LIB_NAME = 'custom-elements-ts';

const resolve = require('rollup-plugin-node-resolve');
const typescript = require('rollup-plugin-typescript2');

const MagicString = require('magic-string');

function stripCode () {
  return {
    name: 'stripCode',
    transform (source, id) {
      let code = source.replace(/(\/\*([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*+\/)|(\/\/.*)/g, '')
      const magicString = new MagicString(code)
      let map = magicString.generateMap({hires: true})
      return {code, map}
    }
  }
}

const createConfig = () => {
  return [ 'umd', 'esm5', 'esm2015' ].map(format => {
    const tsConfig = { 
      compilerOptions: {
        target: (format.includes('esm2015') ? 'es2015': 'es5')
      }
    };

    const file = (format.includes('umd')) 
      ? path.join('dist', 'bundles', `${LIB_NAME}.umd.js`)
      : path.join('dist', format, `${LIB_NAME}.js`)

    const hasDeclation = (format.includes('esm2015') || format.includes('umd') ? true: false);

    const formatType = (format.includes('umd') ? 'umd' : 'es');

    return {
      inputOptions: {
        treeshake: true,
        input: 'src/index.ts',
        plugins: [ 
          stripCode(),
          typescript({ 
            tsconfig: 'src/tsconfig.json',
            tsconfigOverride: { ...tsConfig },
            check: false,
            cacheRoot: path.join(path.resolve(), 'node_modules/.tmp/.rts2_cache'), 
            useTsconfigDeclarationDir: hasDeclation
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
        file: file,
        name: LIB_NAME, 
        format: formatType
      }
    };
  });
};

const copyDtsFiles = async () => {
  const files = await globFiles('dist/esm5/**/*.d.ts');
  return Promise.all(files.map(file => {
    const destPath = file.replace('esm5' + path.sep, '');
    return renameAsync(file, destPath); 
  }));
};

const copyPkgFile = () => buildCopyPackageFile(LIB_NAME, { 
  main: `./bundles/${LIB_NAME}.umd.js`,
  esm5: `./esm5/${LIB_NAME}.js`,
  module: `./esm5/${LIB_NAME}.js`,
  esm2015: `./esm2015/${LIB_NAME}.js`,
  typings: 'index.d.ts'
});

Promise.all([ clean('dist'), clean('.tmp') ])
  .then(() => Promise.all(createConfig().map(config => rollupBuild(config))))
  .then(() => Promise.all([ copyPkgFile(), copyReadMe(), copyDtsFiles() ]))