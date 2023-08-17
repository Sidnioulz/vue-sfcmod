import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import commonjs from 'rollup-plugin-commonjs'
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
    interop: 'auto',
    preserveModules: true,
    sourcemap: true,
  },
  plugins: [
    resolve({
      dedupe: vueCorePackage,
      mainFields: ['node', 'module', 'main'],
    }),
    commonjs(),
    nodeExternals({
      deps: true,
      include: vueCorePackage,
    }),
    vue({
      target: 'node',
    }),
    typescript(),
  ],
}
