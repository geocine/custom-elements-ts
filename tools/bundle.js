const path = require('path');

const { rollup } = require('rollup');
const { clean } = require('./clean');
const { renameAsync, readFileAsync, writeFileAsync, getFiles } = require('./files');
const { stripCode } = require('./rollup-plugin-strip-comments');

const resolve = require('rollup-plugin-node-resolve');
const typescript = require('rollup-plugin-typescript2');

const LIB_NAME = 'custom-elements-ts';

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

const copyDtsFiles = () => {
  const files = getFiles('dist/esm5/**/*.d.ts').join(',').split(',');
  return Promise.all(files.map(file => {
    const destPath = file.replace('esm5' + path.sep, '');
    return renameAsync(file, destPath); 
  }));
};

const copyPkgFile = () => {
  const pkgFile = path.join(path.resolve(), 'package.json');
  return readFileAsync(pkgFile, 'utf8')
    .then(content => {
      const destPath = path.join(path.dirname(pkgFile), 'dist', 'package.json');
      const pkg = { 
        ...JSON.parse(content),  
        ...{ main: `./bundles/${LIB_NAME}.umd.js` }, 
        ...{ esm5: `./esm5/${LIB_NAME}.js` },
        ...{ module: `./esm5/${LIB_NAME}.js` },
        ...{ esm2015: `./esm2015/${LIB_NAME}.js` },
        ...{ typings: 'index.d.ts' } 
      };
      return writeFileAsync(destPath, JSON.stringify(pkg, '\t', 2));
    });
};

const rollupBuild = ({ inputOptions, outputOptions  }) => {
  return rollup(inputOptions).then(bundle => bundle.write(outputOptions));
};

Promise.all([ clean('dist'), clean('.tmp') ])
  .then(() => Promise.all(createConfig().map(config => rollupBuild(config))))
  .then(() => Promise.all([ copyDtsFiles(), copyPkgFile() ]));