import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';

export default [
  {
    input: 'sidepanel/index.js',
    output: {
      dir: 'dist/sidepanel',
      format: 'iife',
    },
    plugins: [
      commonjs(),
      nodeResolve(),
      copy({
        targets: [
          {
            src: ['manifest.json', 'background.js', 'sidepanel', 'images'],
            dest: 'dist'
          }
        ]
      })
    ]
  },
  {
    input: 'scripts/extract-content.js',
    output: {
      dir: 'dist/scripts',
      format: 'es'
    },
    plugins: [
      commonjs(),
      nodeResolve(),
    ]
  }
];
