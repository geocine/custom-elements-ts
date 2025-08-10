const path = require('path');
const rollup = require('rollup');
const resolve = require('rollup-plugin-node-resolve');
const typescript = require('rollup-plugin-typescript2');
const rimraf = require('rimraf');
const { existsSync, mkdirSync, renameSync, copyFileSync, readFileSync, writeFileSync } = require('fs');
const glob = require('glob');
const MagicString = require('magic-string');

const LIB_NAME = 'custom-elements-ts';

function stripCode() {
  return {
    name: 'stripCode',
    transform(source, id) {
      let code = source.replace(/(\/\*([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*+\/)|(\/\/.*)/g, '')
      const magicString = new MagicString(code)
      let map = magicString.generateMap({ hires: true })
      return { code, map }
    }
  }
}

const createConfig = () => {
  return ['umd', 'esm5', 'esm2015'].map(format => {
    const tsConfig = {
      compilerOptions: {
        target: (format.includes('esm2015') ? 'es2015' : 'es5')
      }
    };

    const file = (format.includes('umd'))
      ? path.join('dist', 'bundles', `${LIB_NAME}.umd.js`)
      : path.join('dist', format, `${LIB_NAME}.js`)

    const hasDeclaration = (format.includes('esm2015') || format.includes('umd') ? true : false);

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
            useTsconfigDeclarationDir: hasDeclaration
          }),
          resolve()
        ],
        onwarn(warning) {
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

async function clean(dir) {
  return new Promise((resolve, reject) => {
    rimraf(dir, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function rollupBuild(config) {
  const bundle = await rollup.rollup(config.inputOptions);
  await bundle.write(config.outputOptions);
}

const copyDtsFiles = async () => {
  const files = glob.sync('dist/esm5/**/*.d.ts');
  return Promise.all(files.map(file => {
    const destPath = file.replace('esm5' + path.sep, '');
    renameSync(file, destPath);
  }));
};

const copyReadMe = () => {
  if (existsSync('README.md')) {
    copyFileSync('README.md', path.join('dist', 'README.md'));
  }
};

const buildCopyPackageFile = (libName, paths) => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
  const distPkg = {
    name: libName,
    version: pkg.version,
    description: pkg.description,
    main: paths.main,
    module: paths.module,
    esm5: paths.esm5,
    esm2015: paths.esm2015,
    typings: paths.typings,
    peerDependencies: pkg.peerDependencies,
    repository: pkg.repository,
    keywords: pkg.keywords,
    author: pkg.author,
    license: pkg.license,
    bugs: pkg.bugs,
    homepage: pkg.homepage
  };
  
  if (!existsSync('dist')) {
    mkdirSync('dist', { recursive: true });
  }
  
  if (!existsSync('dist/bundles')) {
    mkdirSync('dist/bundles', { recursive: true });
  }
  
  writeFileSync(path.join('dist', 'package.json'), JSON.stringify(distPkg, null, 2));
};

const copyPkgFile = () => buildCopyPackageFile(LIB_NAME, {
  main: `./bundles/${LIB_NAME}.umd.js`,
  esm5: `./esm5/${LIB_NAME}.js`,
  module: `./esm2015/${LIB_NAME}.js`,
  esm2015: `./esm2015/${LIB_NAME}.js`,
  typings: 'index.d.ts'
});

Promise.all([clean('dist'), clean('.tmp')])
  .then(() => Promise.all(createConfig().map(config => rollupBuild(config))))
  .then(() => Promise.all([copyPkgFile(), copyReadMe(), copyDtsFiles()]))
  .catch(err => {
    console.error('Bundle failed:', err);
    process.exit(1);
  });