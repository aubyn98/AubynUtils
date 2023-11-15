import { defineConfig } from 'vite';
import babel from '@rollup/plugin-babel';

export default defineConfig({
  define: {
    // process: 'process'
  },
  publicDir: false,
  build: {
    lib: {
      entry: {
        array: './src/array',
        date: './src/date',
        EventBus: './src/EventBus',
        file: './src/file',
        magic: './src/magic',
        num: './src/num',
        object: './src/object',
        storage: './src/storage',
        str: './src/str',
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
      plugins: [babel({ plugins: ['@babel/plugin-proposal-nullish-coalescing-operator', '@babel/plugin-proposal-logical-assignment-operators'] })]
    },
    minify: true
  }
});
