module.exports = function(config) {
  config.set({
      frameworks: ['jasmine', 'karma-typescript'],
      files: [
          { pattern: 'src/**/*.ts' },
          { pattern: 'tests/**/*.ts' }
      ],
      preprocessors: {
          '**/*.ts': 'karma-typescript'
      },

      karmaTypescriptConfig: {
        exclude: ['demos'],
        bundlerOptions: {
          entrypoints: /.*\.spec\.ts$/,
        },
        compilerOptions: {
          rootDir: 'libs',
          skipLibCheck: true,
          lib: ['ES2015', 'DOM'],
          target: "es6",
          paths: {
            'custom-elements-ts': ['src/index']
          },
          baseUrl: '.'
        },
        coverageOptions: {
          exclude: /((.*\.spec)|index)\.ts/
        },
        reports: {
          'html': {
            'directory': 'coverage',
            'subdirectory': '.'
          },
          'text-summary': '',
          'lcovonly': {
            'directory': 'coverage',
            'subdirectory': '.'
          }
        },
      },

      reporters: ['mocha', 'karma-typescript'],
      browsers: ['ChromeHeadless'],
      failOnEmptyTestSuite: false
  });
};