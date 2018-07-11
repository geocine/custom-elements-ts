const MagicString = require('magic-string')

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

exports.stripCode = stripCode;