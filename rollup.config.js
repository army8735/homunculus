import commonjs from 'rollup-plugin-commonjs';

export default {
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
};
