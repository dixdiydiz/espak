import resolve from 'resolve'
import log from 'loglevel'
import path from 'path'
import { UserConfig } from '../config'
import { startBuildServe } from './wrapEsbuild'
import {
  Format,
  Plugin,
  OnResolveOptions,
  OnResolveArgs,
  OnResolveResult,
  OnLoadOptions,
  OnLoadArgs,
  OnLoadResult,
  BuildOptions,
} from 'esbuild'
import { createTempDist, TempDist } from '../index'
import { isObject } from '../utils'

interface ResolveModuleResult {
  resolvepath: string
  root: string
  dir: string
  base: string
  ext: string
  name: string
  relativedir: string
  relativepath: string
}
export function resolveModule(extensions: string[], alias: unknown, to: string, from: string): ResolveModuleResult {
  if (alias && isObject(alias) && !/^(\.\/|\.\.\/)/.test(to)) {
    for (let [key, val] of Object.entries(alias)) {
      const reg = new RegExp(`^${key}`)
      if (reg.test(to)) {
        to = to.replace(reg, val)
        break
      }
    }
  }
  const { dir: fromdir } = path.parse(from)
  const file = resolve.sync(to, {
    basedir: fromdir,
    extensions,
  })
  const { root, dir, base, ext, name } = path.parse(file)
  let relativedir = path.relative(dir, fromdir)
  if (!relativedir) {
    relativedir = './'
  }
  const relativepath = path.resolve(relativedir, base)
  return {
    resolvepath: to,
    root,
    dir,
    base,
    ext,
    name,
    relativedir,
    relativepath,
  }
}

/**
 * rewrite esbuild plugin types
 * start
 */
export interface EspakBuildOptions extends BuildOptions {
  sourcefile?: string
}
export interface EspakOnResolveResult extends OnResolveResult {
  buildOptions?: EspakBuildOptions
}

type OnResloveCallback = (
  args: OnResolveArgs
) => EspakOnResolveResult | null | undefined | Promise<EspakOnResolveResult | null | undefined>
type OnLoadCallback = (args: OnLoadArgs) => OnLoadResult | null | undefined | Promise<OnLoadResult | null | undefined>

export interface PluginBuild {
  onResolve(options: OnResolveOptions, callback: OnResloveCallback): void
  onLoad(options: OnLoadOptions, callback: OnLoadCallback): void
}
export interface EspakPlugin {
  name: string
  setup: (build: PluginBuild) => void
  namespace?: string
}

type ResolveMap = Map<OnResolveOptions, OnResloveCallback>

type LoadMap = Map<OnLoadOptions, OnLoadCallback>
/**
 * rewrite esbuild plugin types
 * end
 */

export interface BuildUtil {
  namespaces?: string[]
}
export type ProxyPlugin = (
  util: BuildUtil,
  onResolves: (args: OnResolveArgs, plugin: Plugin) => Promise<any>,
  onLoads: any
) => Promise<Plugin>

export async function createPlugin(
  proxyPlugin: ProxyPlugin,
  plugins: EspakPlugin[],
  config: UserConfig
): Promise<Plugin> {
  const {
    resolve: { extensions, alias },
  } = config
  const resolveModuleFn = resolveModule.bind(null, extensions, alias)
  const { namespaces, resolveMap, loadMap } = mobilizePlugin(plugins)
  return proxyPlugin(
    { namespaces },
    onResolves.bind(null, resolveModuleFn, resolveMap),
    onLoads.bind(null, resolveModuleFn, loadMap)
  )
}

function mobilizePlugin(plugins: EspakPlugin[]) {
  const resolveMap: ResolveMap = new Map()
  const loadMap: LoadMap = new Map()
  const namespaces: string[] = []
  plugins.forEach((ele) => {
    try {
      const { setup, namespace } = ele
      if (namespace) {
        namespaces.push(namespace)
      }
      setup({
        onResolve,
        onLoad,
      })
    } catch (e) {
      log.error(e)
    }
  })
  return {
    resolveMap,
    loadMap,
    namespaces,
  }

  function onResolve(options: OnResolveOptions, callback: OnResloveCallback): void {
    resolveMap.set(options, callback)
  }
  function onLoad(options: OnLoadOptions, callback: OnLoadCallback): void {
    loadMap.set(options, callback)
  }
}

async function onResolves(
  resolveFn: (to: string, from: string) => ResolveModuleResult,
  resolveMap: ResolveMap,
  args: OnResolveArgs,
  esbuildPlugin: Plugin
): Promise<unknown> {
  const { path, importer, resolveDir, namespace: importerNamespace } = args
  const dist: TempDist = await createTempDist()
  if (importer) {
    for (let [key, cb] of resolveMap) {
      const { filter, namespace } = key
      if (filter.test(path) && namespace === importerNamespace) {
        const resolveResult = await cb({ ...args })
        if (resolveResult?.buildOptions) {
        }
      }
    }
  } else {
    return null
  }
}

async function onLoads(
  resolveFn: (to: string, from: string) => ResolveModuleResult,
  loadMap: LoadMap,
  args: OnResolveArgs,
  esbuildPlugin: Plugin
): Promise<unknown> {
  const { path, namespace: argsNamespace } = args
  const dist: TempDist = await createTempDist()
  // for (let [key, value] of resolveMap) {
  //   const { filter, namespace } = key
  // }
  return null
}

// async function exceptionHandle(fn: Function, ...args: any[]): Promise<Plugin | null> {
//   try {
//     return await fn(...args)
//   } catch (e) {
//     log.error(e)
//     return null
//   }
// }
interface CustomBuildOption {
  dist: TempDist
  plugins: EspakPlugin[]
}
export async function entryHandler(src: string[], option: CustomBuildOption): Promise<void> {
  const { dist, plugins } = option
  const builder = src.map((entry) => {
    const { name } = path.parse(entry)
    return {
      entryPoints: [entry],
      bundle: true,
      minify: true,
      format: 'esm' as Format,
      outfile: path.resolve(dist.tempSrc, name, '.js'),
      plugins,
    }
  })
  await startBuildServe(builder)
}
