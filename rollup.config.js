import typescript from 'rollup-plugin-typescript2';
import {terser} from 'rollup-plugin-terser';

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/bundle.js',
    format: 'umd',
    name: 'counter-element'
  },
  plugins: [
    typescript({ cacheRoot: '.tmp'}),
    terser({ keep_fnames: true })
  ]
};
