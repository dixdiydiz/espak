import { builtinModules } from 'module'
const { dependencies: originalDependencies } = require('../../../package.json')
import resolve from 'resolve'
import log from 'loglevel'
import path from 'path'

export interface ResolveOptions {
  pathSource: string
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

enum ModuleFlag {
  BUILTIN = 'BUILTIN',
  THIRD = 'THIRD',
  CUSTOM = 'CUSTOM',
}

export const srcToBuild = Object.create(null)
const dependencies: string[] = Object.keys(originalDependencies)

const importedReg = /(?:import\((?:(?:'(\S+)')|(?:"(\S+)"))\))|(?:import\s*(?:(?:'(\S+)')|(?:"(\S+)"));)|(?:import\s+[^;\"\']+from\s*(?:(?:'([^\s\']+)')|(?:"([^\s\"]+)"));)/g

export function resolveModule(options: ResolveOptions): RawInModule {
  const { pathSource } = options
  const infile = resolve.sync(pathSource, options)
  const { dir, ext } = path.parse(infile)
  const moduleFlag = obtainModuleFlag(pathSource)
  switch (moduleFlag) {
    case ModuleFlag.BUILTIN:
  }
  return (srcToBuild[infile] = {
    infile,
    dir,
    ext,
    pathSource,
    moduleFlag: obtainModuleFlag(pathSource),
  })
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
// 改成：用户模块在handleImportation 函数中缓存srcToBuild[infile]，
// 然后根据引入模块的类型不同调用不同的方法。
export async function handleImportation(input: RipeInModule): Promise<any> {
  const { infile, dir, text } = input
  const matchs = text.matchAll(importedReg)
  for (let m of matchs) {
    const match = {
      match: m[0],
      start: m.index,
      end: m.index! + m[0].length,
    }
    const moduleInfo = distinguishMdoule(m.slice(1, 7), { basedir: dir })
    if (moduleInfo.moduleFlag === ModuleFlag.THIRD) {
    }
  }
  // TODO: 补充 resolve 模块的类型检查
  function distinguishMdoule(match: string[], options: any): RawInModule {
    const relativePath: string = match.find((e: string | undefined) => e !== void 0) || ''
    try {
      const absolutePath = resolve.sync(relativePath, {
        extensions: ['.tsx', '.ts', '.jsx', '.js'],
        ...options,
      })
      return {
        infile: absolutePath,
        fromPath: relativePath,
        moduleFlag: obtainModuleFlag(relativePath),
      }
    } catch (e) {
      log.warn(e)
      return {
        infile: '',
        fromPath: '',
      }
    }
  }
}
// export async earlierCustomModuleHandler ({resolveOptions, esbuildOptions}) {}
