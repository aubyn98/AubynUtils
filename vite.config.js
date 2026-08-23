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
    // es2015: 防止 esbuild 压缩时把 babel 已降级的语法（如 ??）重新升回去
    // （不能设 es5：rollup 生成的 chunk 胶水代码含 const，esbuild 无法降级）
    target: 'es2015',
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
          // preset-env 全量降级到 ES5（含 ??/?. /async 等），regenerator 助手会被内联进产物
          presets: [['@babel/preset-env', { targets: { ie: 11 } }]]
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
