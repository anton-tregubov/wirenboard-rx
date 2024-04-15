import { RollupOptions } from 'rollup'
import typescript from '@rollup/plugin-typescript'
import { dts } from 'rollup-plugin-dts'
import nodeResolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'

const bundle: RollupOptions[] = [
  {
    // context: 'global',
    plugins: [nodeResolve(), commonjs(), typescript()],
    input: 'src/main/ts/index.ts',
    output: [
      {
        file: 'dist/index.es.js',
        format: 'es',
        sourcemap: true,
      },
      {
        file: 'dist/index.cjs',
        format: 'cjs',
        sourcemap: true,
      },
    ],
  },
  {
    plugins: [typescript(), dts()],
    input: 'src/main/ts/index.ts',
    output: [
      {
        file: 'dist/index.d.ts',
      },
    ],
  }]
export default bundle