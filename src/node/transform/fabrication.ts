import { builtinModules } from 'module'
import resolve from 'resolve'
import log from 'loglevel'
import path from 'path'
import { startBuildServe, singleBuild } from './wrapEsBuild'
import { BuildOptions, BuildResult } from 'esbuild'
import { espakTempSrc, espakTempModule } from '../index'
import { customBuildOption } from '../config'

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
  moduleFlag: ModuleFlag
  importMode?: ImportMode
}
export interface MedInModule {
  text: string
  outfile?: string
  //依赖
  hasDepends?: WeakSet<RipeInModule>
  dependsOn?: WeakSet<Dependency>
}
interface Dependency {
  match: string
  start?: number
  end?: number
  pathSource: string
  infile?: string
  outfile?: string
  refer: RawInModule & Partial<MedInModule>
}

export type RipeInModule = RawInModule & MedInModule

export enum ModuleFlag {
  BUILTIN = 'BUILTIN',
  THIRD = 'THIRD',
  CUSTOM = 'CUSTOM',
}
export enum ImportMode {
  DYNAMIC,
  SIDE_EFFECT,
  FROM_MODULE,
}

export const srcToBuild = Object.create(null)

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
let packageDependencies: string[]
async function obtainModuleFlag(pathSource: string): Promise<ModuleFlag> {
  if (!packageDependencies) {
    const { infile } = resolveModule('./package.json', {
      basedir: process.cwd(),
    })
    packageDependencies = await import(infile)
      .then((r) => {
        const { dependencies = {} } = r
        return Object.keys(dependencies)
      })
      .catch((e) => {
        log.error(e)
        return []
      })
  }
  if (builtinModules.includes(pathSource)) {
    return ModuleFlag.BUILTIN
  } else if (packageDependencies.includes(pathSource)) {
    return ModuleFlag.THIRD
  }
  return ModuleFlag.CUSTOM
}
// TODO:  export ... from module waiting handle
export async function handleImportation(input: RawInModule & Partial<MedInModule>): Promise<any> {
  const { text } = input
  if (text) {
    const matchs = text.matchAll(importedReg)
    for (let m of matchs) {
      const depend = {
        match: m[0],
        start: m.index,
        end: m.index! + m[0].length,
        refer: input,
      }
      const merge = await distinguishMdoule(m.slice(1))
      if (merge) {
        // console.log({
        //   ...depend,
        //   ...merge,
        // })
        switch (merge.moduleFlag) {
          case ModuleFlag.BUILTIN:
          case ModuleFlag.THIRD:
            await thirdModuleHandler(
              {
                ...depend,
                pathSource: merge.pathSource,
              },
              {
                ...merge,
              }
            )
            break
        }
      }
    }
  }
  async function distinguishMdoule(
    matchs: string[]
    // options: ResolveOptions
  ): Promise<Pick<RawInModule, 'pathSource' | 'importMode' | 'moduleFlag'> | null> {
    let pathSource: string
    let importMode: ImportMode
    const canFind = matchs.some((ele, i) => {
      pathSource = ele
      importMode = Math.floor(i / 2)
      return Boolean(ele)
    })
    if (canFind) {
      const moduleFlag: ModuleFlag = await obtainModuleFlag(pathSource!)
      return {
        pathSource: pathSource!,
        importMode: importMode!,
        moduleFlag,
      }
    }
    return null
  }
}
interface SrcAndBuildOption {
  src: RawInModule & Partial<MedInModule>
  build?: BuildOptions
}

// TODO: loader
export async function earlierCustomModuleHandler(
  srcAndBuild: SrcAndBuildOption[]
): Promise<(RawInModule & Partial<MedInModule>)[]> {
  const preBuildOption: BuildOptions = {
    bundle: false,
    minify: true,
    format: 'esm',
    write: false,
  }
  const builder: BuildOptions[] = []
  const result: (RawInModule & Partial<MedInModule>)[] = []
  for (let { src, build } of srcAndBuild) {
    const { infile } = src
    result.push((srcToBuild[infile] = { ...src, hasDepends: new Set() }))
    builder.push(
      build || {
        ...preBuildOption,
        entryPoints: [infile],
      }
    )
  }
  const buildResult: BuildResult[] = await startBuildServe(builder)
  buildResult.forEach((ele, i) => {
    if (ele.warnings.length) {
      ele.warnings.forEach(log.warn)
    }
    if (ele.outputFiles?.length) {
      result[i].text = ele.outputFiles[0]?.text
    }
  })
  return result
}

export async function thirdModuleHandler(
  dependency: Dependency,
  inModule: Pick<RawInModule, 'pathSource' | 'importMode' | 'moduleFlag'>
): Promise<void> {
  const { pathSource } = dependency
  if (srcToBuild[pathSource]) {
    srcToBuild[pathSource].dependsOn.add(dependency)
  } else {
    const rawInfo = resolveModule(pathSource, {
      basedir: process.cwd(),
    })
    const { infile } = rawInfo
    const outfile = path.resolve(espakTempModule, `./${pathSource}.js`)
    await singleBuild({
      entryPoints: [infile],
      outfile,
      bundle: true,
      minify: true,
      format: 'esm',
      ...customBuildOption(pathSource, infile),
    })
    dependency = {
      ...dependency,
      infile,
      outfile,
    }
    const dependsOn = new Set()
    dependsOn.add(dependency)
    srcToBuild[pathSource] = srcToBuild[infile] = {
      ...rawInfo,
      outfile,
      ...inModule,
      dependsOn,
    }
    console.log(srcToBuild[infile])
  }
}
