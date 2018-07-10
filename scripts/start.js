const { promisify } = require('util');
const { rollup } = require('rollup');
const { writeFile, existsSync, mkdirSync, copyFile, readFile } = require('fs');
const { basename, dirname, join, resolve, sep } = require('path');

const { serverStart } = require('@ngx-devtools/server');

const typescript = require('rollup-plugin-typescript2');
const { minify } = require('terser');

const { inlineSources } = require('./inline-sources');

const writeFileAsync = promisify(writeFile);
const copyFileAsync = promisify(copyFile);

const ELEMENT_NAME = process.argv[2];
const DEST_PATH = 'dist';

if(ELEMENT_NAME == undefined){
  console.log('specify which element to start');
  console.log(' ↳  eg. npm start element-name');
  return;
}

if(!existsSync(`demos/${ELEMENT_NAME}/${ELEMENT_NAME}.ts`)){
  console.log('element does not exist');
  return; 
}

const mkdirp = (directory) => {
  const dirPath = resolve(directory).replace(/\/$/, '').split(sep);
  for (let i = 1; i <= dirPath.length; i++) {
    const segment = dirPath.slice(0, i).join(sep);
    if (!existsSync(segment) && segment.length > 0) {
      mkdirSync(segment);
    }
  }
};

const uglify = (userOptions, minifier = minify) => {
  const options = Object.assign({ sourceMap: true }, userOptions);
  return {
    name: "uglify",
    transformBundle (code) {
      const result = minifier(code, options);
      if (result.error) {
        throw result.error;
      }
      return result;
    }
  };
};

const toPascalCase = (text) => {
  return text.replace(/-\w/g, m => m[1].toUpperCase())
    .replace(/^\w/, c => c.toUpperCase());
}

const config = {
  inputOptions: {
    treeshake: true,
    input: `.tmp/${ELEMENT_NAME}/index.ts`,
    plugins: [
      typescript({ 
        useTsconfigDeclarationDir: true,
        check: false,
        cacheRoot: join(resolve(), 'node_modules/.tmp/.rts2_cache')
      }),
      //uglify()
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

const rollupBuild = ({ inputOptions, outputOptions }) => {
  return rollup(inputOptions)
  .then(bundle => bundle.generate(outputOptions))
  .then(({ code, map }) => {
    mkdirp(dirname(outputOptions.file));
    return Promise.all([ 
      writeFileAsync(outputOptions.file, code + `\n//# sourceMappingURL=${basename(outputOptions.file)}.map`),
      writeFileAsync(outputOptions.file + '.map', map.toString())
    ])
  });
};

const copy = () => {
  mkdirp(DEST_PATH);
  return copyFileAsync(`demos/${ELEMENT_NAME}/index.html`, join(DEST_PATH, 'index.html'));
};

inlineSources('demos/**/*.ts', '.tmp')
  .then(() => Promise.all([ copy(), rollupBuild(config), serverStart() ]));