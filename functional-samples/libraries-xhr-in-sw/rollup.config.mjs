import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'background.js',
  output: {
    inlineDynamicImports: true,
    file: 'dist/background.js',
  },
  plugins: [
    commonjs(),
    nodeResolve(),
  ]
};
