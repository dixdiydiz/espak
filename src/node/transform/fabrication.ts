import { builtinModules } from 'module'
import resolve from 'resolve'
import log from 'loglevel'
import { startBuildServe, singleBuild } from './wrapEsBuild'
import { Format, Plugin, OnResolveArgs, OnResolveResult } from 'esbuild'
import { espakTempSrc, espakTempModule } from '../index'
import { finalConfig } from '../config'
import { isArray } from '../../../dist/node/utils'

export interface ResolveOptions {
  basedir?: string
  extensions?: string[]
  includeCoreModules?: boolean
}
//
// export interface RawInModule {
//   infile: string
//   dir: string
//   ext: string
//   label?: string
//   pathSource: string
//   moduleFlag: ModuleFlag
//   importMode?: ImportMode
// }
// export interface MedInModule {
//   text: string
//   outfile?: string
//   //依赖
//   hasDepends?: WeakSet<RipeInModule>
//   dependsOn?: WeakSet<Dependency>
// }
// interface Dependency {
//   match: string
//   start?: number
//   end?: number
//   pathSource: string
//   infile?: string
//   outfile?: string
//   refer: RawInModule & Partial<MedInModule>
// }
//
// export type RipeInModule = RawInModule & MedInModule
//
// export enum ModuleFlag {
//   BUILTIN = 'BUILTIN',
//   THIRD = 'THIRD',
//   CUSTOM = 'CUSTOM',
// }
// export enum ImportMode {
//   DYNAMIC,
//   SIDE_EFFECT,
//   FROM_MODULE,
// }
//
// export const srcToBuild = Object.create(null)
//
// const importedReg = /(?:import\((?:(?:'(\S+)')|(?:"(\S+)"))\))|(?:import\s*(?:(?:'(\S+)')|(?:"(\S+)"));)|(?:import\s+[^;\"\']+from\s*(?:(?:'([^\s\']+)')|(?:"([^\s\"]+)"));)/g
//
export function resolveModule(pathSource: string, options: ResolveOptions): string {
  const infile = resolve.sync(pathSource, options)
  return infile
}
// let packageDependencies: string[]
//
// // TODO:  export ... from module waiting handle
// export async function handleImportation(input: RawInModule & Partial<MedInModule>): Promise<any> {
//   const { text } = input
//   if (text) {
//     const matchs = text.matchAll(importedReg)
//     for (let m of matchs) {
//       const depend = {
//         match: m[0],
//         start: m.index,
//         end: m.index! + m[0].length,
//         refer: input,
//       }
//       const merge = await distinguishMdoule(m.slice(1))
//       if (merge) {
//         // console.log({
//         //   ...depend,
//         //   ...merge,
//         // })
//         switch (merge.moduleFlag) {
//           case ModuleFlag.BUILTIN:
//           case ModuleFlag.THIRD:
//             await thirdModuleHandler(
//               {
//                 ...depend,
//                 pathSource: merge.pathSource,
//               },
//               {
//                 ...merge,
//               }
//             )
//             break
//         }
//       }
//     }
//   }
//   async function distinguishMdoule(
//     matchs: string[]
//     // options: ResolveOptions
//   ): Promise<Pick<RawInModule, 'pathSource' | 'importMode' | 'moduleFlag'> | null> {
//     let pathSource: string
//     let importMode: ImportMode
//     const canFind = matchs.some((ele, i) => {
//       pathSource = ele
//       importMode = Math.floor(i / 2)
//       return Boolean(ele)
//     })
//     if (canFind) {
//       const moduleFlag: ModuleFlag = await obtainModuleFlag(pathSource!)
//       return {
//         pathSource: pathSource!,
//         importMode: importMode!,
//         moduleFlag,
//       }
//     }
//     return null
//   }
// }
// interface SrcAndBuildOption {
//   src: RawInModule & Partial<MedInModule>
//   build?: BuildOptions
// }
// type OnResolveCb = (
//   args: OnResolveArgs
// ) => OnResolveResult | null | undefined | Promise<OnResolveResult | null | undefined>
export let globalModulePlugins: Plugin
export async function constructGlobalModulePlugins(external: unknown): Promise<Plugin> {
  const path = resolveModule('./package.json', {
    basedir: process.cwd(),
  })
  const packageDependencies: string[] = await import(path)
    .then((r) => {
      const { dependencies = {} } = r
      return Object.keys(dependencies)
    })
    .catch((e) => {
      log.error(e)
      return []
    })
  const onResolveItems: string[] = isArray(external)
    ? packageDependencies.filter((ele) => !external.includes(ele))
    : packageDependencies
  return {
    name: 'packageDependencies',
    setup(build) {
      console.log('from constructGlobalModulePlugins fn', onResolveItems)
      onResolveItems.forEach((ele) => {
        build.onResolve({ filter: new RegExp(`^${ele}$`) }, (args) => ({
          path: args.path,
          external: true,
        }))
      })
    },
  }
}

export async function customModuleHandler(src: string[]): Promise<void> {
  console.log(src)
  if (!globalModulePlugins) {
    globalModulePlugins = await constructGlobalModulePlugins(finalConfig.external)
  }
  const { plugins = [] } = finalConfig
  const builder = [
    {
      entryPoints: src,
      bundle: true,
      outdir: espakTempSrc,
      outbase: 'src',
      minify: true,
      format: 'esm' as Format,
      plugins: [globalModulePlugins, ...plugins],
    },
  ]
  await startBuildServe(builder)
}
