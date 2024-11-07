import { defineConfig } from 'vite';
import babel from '@rollup/plugin-babel';
import copy from 'rollup-plugin-copy';

const folders = ['array', 'date', 'EventBus', 'file', 'magic', 'num', 'object', 'storage', 'str'];
const entrys = folders.reduce((_, k) => {
  // 'array/index': './src/array'
  _[`${k}/index`] = `./src/${k}`;
  return _;
}, {});

export default defineConfig({
  define: {
    // process: 'process'
  },
  publicDir: false,
  build: {
    lib: {
      entry: {
        ...entrys,
        index: './src/index.js'
      },
      formats: ['cjs']
    },
    emptyOutDir: true,
    outDir: './lib',
    rollupOptions: {
      external: ['lodash'],
      output: {
        entryFileNames: '[name].js'
      },
      plugins: [
        babel({
          plugins: [
            '@babel/plugin-proposal-nullish-coalescing-operator',
            '@babel/plugin-proposal-logical-assignment-operators',
            '@babel/plugin-proposal-optional-chaining',
            '@babel/plugin-transform-parameters',
          ]
        }),
        copy({
          targets: [{ src: `types/*`, dest: `lib` }],
          hook: 'writeBundle'
        })
      ]
    },
    minify: true
  }
});
