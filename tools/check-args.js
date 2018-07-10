const isProcess = (list) => {
  let result = false;
  const index = process.argv.findIndex(value => list.includes(value));
  const isBoolean = (process.argv[index + 1] === 'true' || process.argv[index + 1] === 'false');
  if (index >= 0) {
    if (isBoolean || process.argv[index + 1] !== 'false') result = true;
  }
  return result;
};

exports.isProcess = isProcess;