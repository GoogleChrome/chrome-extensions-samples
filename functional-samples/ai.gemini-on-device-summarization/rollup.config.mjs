import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'scripts/extract-content.js',
  output: {
    dir: 'dist/scripts',
    format: 'cjs'
  },
  plugins: [commonjs(), nodeResolve()]
};
