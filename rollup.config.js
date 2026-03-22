import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import nodeExternals from 'rollup-plugin-node-externals'
import vue from 'rollup-plugin-vue'

const vueCorePackage = [
  'vue',
  '@vue/compiler-core',
  '@vue/compiler-dom',
  '@vue/compiler-sfc',
  '@vue/shared',
]

export default {
  input: ['index.ts', 'bin/vue-sfcmod.ts'],
  output: {
    dir: 'dist',
    format: 'esm',
    preserveModules: true,
    sourcemap: true,
  },
  plugins: [
    typescript(),
    resolve({
      dedupe: vueCorePackage,
      mainFields: ['node', 'module', 'main'],
      extensions: ['.ts', '.js', '.mjs', '.json'],
    }),
    nodeExternals({
      deps: true,
      include: vueCorePackage,
    }),
    vue({
      target: 'node',
    }),
  ],
}
