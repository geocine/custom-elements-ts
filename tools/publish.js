const { promisify } = require('util');
const { writeFile, copyFile, readFile } = require('fs');
const { clean } = require('./clean');
const { mkdirp } = require('./mkdrip');

const readFileAsync = promisify(readFile);
const writeFileAsync = promisify(writeFile);
const copyFileAsync = promisify(copyFile);

const DEST_PATH = 'dist';

const copyReadme = () => {
  return copyFileAsync('README.md', `${DEST_PATH}/README.md`);
};

const removeConfig = (file,property) => {
  const pattern = new RegExp(`\\s*\\"${property}\\": \\{(?=.*\\s)[^{}]+\},`)
  return file.replace(pattern, '');
}

const addPackageJson = () => {
  return readFileAsync('package.json', 'utf8')
  .then(content => {
    content = removeConfig(content,'devDependencies');
    content = removeConfig(content,'scripts');
    return writeFileAsync(`${DEST_PATH}/package.json`, content);
  });
};


clean(DEST_PATH).then(() => {
  mkdirp(DEST_PATH);
  Promise.all([copyReadme(),addPackageJson()])
});

