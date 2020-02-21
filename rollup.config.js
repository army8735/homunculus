import commonjs from 'rollup-plugin-commonjs';
import { uglify } from 'rollup-plugin-uglify';

export default [{
  input: 'src/homunculus.js',
  output: {
    name: 'homunculus',
    file: 'homunculus.js',
    format: 'umd',
    sourcemap: true,
  },
  plugins: [
    commonjs({
      exclude: 'node_modules/**' // 只编译我们的源代码
    }),
  ],
}, {
  input: 'src/homunculus.js',
  output: {
    name: 'homunculus',
    file: 'homunculus.min.js',
    format: 'umd',
    sourcemap: true,
  },
  plugins: [
    commonjs({
      exclude: 'node_modules/**' // 只编译我们的源代码
    }),
    uglify({
      sourcemap: true,
    }),
  ],
}];
