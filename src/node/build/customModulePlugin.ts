import { Plugin } from '../plugin-system/agency'
import path from 'path'
import {Format} from "esbuild";

const customModulePlugin: (alias: unknown)=> Plugin = (alias: unknown) => {
  const match: string[] = ['./', '../', ...Object.keys( isObject(alias) ? alias : )]
  const rege: RegExp = new RegExp(
    match.reduce((prev, curr) => {
      return `${prev}|^${curr}`
    }, '^\\b$')
  )
  return {
    name: 'customModulePlugin',
    setup({onResolve, heelHook, triggerBuild}) {
      onResolve({filter: rege}, (args) => {
        heelHook(() => triggerBuild({
          entryPoints: [args.absolutePath],
          format: 'esm' as Format,
          outfile: `module`,
          minify: false,
        }))
        return {
          external: true,
        }
      })
    }
  }
}

// const customModulePlugin:  = {
//   name: 'customModulePlugin',
//   setup({ onResolve }) {
//     onResolve({ filter: reg }, (args) => {
//       return {
//         external: true,
//         a: 1,
//         outputOptions: {
//           sourcePath: args.modulePath,
//           outputDir: 'src',
//           outputExtension: '.js',
//           outbase: 'src',
//         },
//       }
//     })
//   },
// }

export default customModulePlugin
