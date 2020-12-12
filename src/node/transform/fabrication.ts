import { builtinModules } from 'module'
const { dependencies: originalDependencies } = require('../../../package.json')
import resolve from 'resolve'
import log from 'loglevel'
import path from 'path'
import { startBuildServe } from './wrapEsBuild'
import { BuildOptions, BuildResult } from 'esbuild'

export interface ResolveOptions {
  basedir?: string
  extensions?: string[]
  includeCoreModules?: boolean
}

export interface RawInModule {
  infile: string
  dir: string
  ext: string
  label?: string
  pathSource: string
  moduleFlag: string
}
export interface MedInModule {
  text: string
  outfile: string
  //依赖
  dependencies?: WeakSet<RipeInModule>
  beDependencies?: WeakSet<RipeInModule>
}

type RipeInModule = RawInModule & MedInModule

export enum ModuleFlag {
  BUILTIN = 'BUILTIN',
  THIRD = 'THIRD',
  CUSTOM = 'CUSTOM',
}

export const srcToBuild = Object.create(null)
const dependencies: string[] = Object.keys(originalDependencies)

const importedReg = /(?:import\((?:(?:'(\S+)')|(?:"(\S+)"))\))|(?:import\s*(?:(?:'(\S+)')|(?:"(\S+)"));)|(?:import\s+[^;\"\']+from\s*(?:(?:'([^\s\']+)')|(?:"([^\s\"]+)"));)/g

export function resolveModule(pathSource: string, options: ResolveOptions): Omit<RawInModule, 'moduleFlag'> {
  const infile = resolve.sync(pathSource, options)
  const { dir, ext } = path.parse(infile)
  return {
    infile,
    dir,
    ext,
    pathSource,
  }
}
function obtainModuleFlag(pathSource: string): keyof typeof ModuleFlag {
  if (builtinModules.includes(pathSource)) {
    return ModuleFlag.BUILTIN
  } else if (dependencies.includes(pathSource)) {
    return ModuleFlag.THIRD
  }
  return ModuleFlag.CUSTOM
}
// TODO:  export ... from module waiting handle
export async function handleImportation(input: RipeInModule): Promise<any> {
  // const { infile, dir, text } = input
  // const matchs = text.matchAll(importedReg)
  // for (let m of matchs) {
  //   const match = {
  //     match: m[0],
  //     start: m.index,
  //     end: m.index! + m[0].length,
  //   }
  //   const moduleInfo = distinguishMdoule(m.slice(1, 7), { basedir: dir })
  //   if (moduleInfo.moduleFlag === ModuleFlag.THIRD) {
  //   }
  // }
  // TODO: 补充 resolve 模块的类型检查
  // function distinguishMdoule(match: string[], options: any): RawInModule {
  //   const relativePath: string = match.find((e: string | undefined) => e !== void 0) || ''
  //   try {
  //     const absolutePath = resolve.sync(relativePath, {
  //       extensions: ['.tsx', '.ts', '.jsx', '.js'],
  //       ...options,
  //     })
  //     return {
  //       infile: absolutePath,
  //       fromPath: relativePath,
  //       moduleFlag: obtainModuleFlag(relativePath),
  //     }
  //   } catch (e) {
  //     log.warn(e)
  //     return {
  //       infile: '',
  //       fromPath: '',
  //     }
  //   }
  // }
}
interface SrcAndBuildOption {
  src: RawInModule & Partial<MedInModule>
  build?: BuildOptions
}

// TODO: loader
export async function earlierCustomModuleHandler(srcAndBuild: SrcAndBuildOption[]) {
  const preBuildOption: BuildOptions = {
    bundle: false,
    minify: true,
    format: 'esm',
    write: false,
  }
  const builder: BuildOptions[] = []
  const infileInOrder: string[] = []
  for (let { src, build } of srcAndBuild) {
    const { infile } = src
    srcToBuild[infile] = { ...src }
    builder.push(
      build || {
        ...preBuildOption,
        entryPoints: [infile],
      }
    )
    infileInOrder.push(infile)
  }
  const result: BuildResult[] = await startBuildServe(builder)
  result.forEach((ele, i) => {
    if (ele.warnings.length) {
      ele.warnings.forEach(log.warn)
    }
    if (ele.outputFiles?.length) {
      const infile: any = infileInOrder[i]
      srcToBuild[infile].text = ele.outputFiles[0]?.text
    }
  })
  console.log(srcToBuild)
}
