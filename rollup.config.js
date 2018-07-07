import typescript from 'rollup-plugin-typescript2';
import {terser} from 'rollup-plugin-terser';

export default {
	input: 'src/counter-element.ts',
  output: {
    file: 'dist/bundle.js',
    format: 'cjs'
  },
	plugins: [
		typescript({ cacheRoot: '.tmp'}),
    terser()
	]
};
