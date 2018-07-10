const { minify } = require('terser');

const uglify = (userOptions) => {
  const options = Object.assign({ sourceMap: true }, userOptions);
  return {
    name: "uglify",
    transformBundle (code) {
      const result = minify(code, options);
      if (result.error) {
        throw result.error;
      }
      return result;
    }
  };
};

exports.uglify = uglify;