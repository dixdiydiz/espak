import resolve from 'resolve'
import log from 'loglevel'
import path from 'path'
import { UserConfig } from '../config'
import { startBuildServe } from './wrapEsbuild'
import {
  BuildOptions,
  Format,
  Plugin,
  OnResolveOptions,
  OnResolveArgs,
  OnResolveResult,
  OnLoadOptions,
  OnLoadArgs,
  OnLoadResult,
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

export interface EspakPlugin extends Plugin {
  namespace?: string
}
export interface EspakOnResolveArgs extends OnResolveArgs {}

export interface BuildUtil {
  namespaces?: string[]
}
export type SimplePlugin = (util: BuildUtil, onResolves: any, onLoads: any) => Promise<Plugin>

export async function createPlugin(
  simplePlugin: SimplePlugin,
  plugins: EspakPlugin[],
  config: UserConfig
): Promise<Plugin> {
  const dist: TempDist = await createTempDist()
  const {
    resolve: { extensions, alias },
  } = config
  const resolveModuleFn = resolveModule.bind(null, extensions, alias)
  const { namespaces, resolveMap, loadMap } = mobilizePlugin(plugins)

  return simplePlugin(
    {namespaces},

    )
}

type OnResloveCallback = (
  args: OnResolveArgs
) => OnResolveResult | null | undefined | Promise<OnResolveResult | null | undefined>

type OnLoadCallback = (args: OnLoadArgs) => OnLoadResult | null | undefined | Promise<OnLoadResult | null | undefined>

type ResolveMap = Map<OnResolveOptions, OnResloveCallback>

type LoadMap = Map<OnLoadOptions, OnLoadCallback>

function mobilizePlugin(plugins: EspakPlugin[]) {
  const resolveMap: ResolveMap = new Map()
  const loadMap: LoadMap = new Map()
  const namespaces: string[] = []
  plugins.forEach((ele) => {
    try {
      const { namespace, setup } = ele
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

async function onResolves(resolveMap: ResolveMap, args: OnResolveArgs): {
  const { path, importer, resolveDir, namespace } = args
}

// async function exceptionHandle(fn: Function, ...args: any[]): Promise<Plugin | null> {
//   try {
//     return await fn(...args)
//   } catch (e) {
//     log.error(e)
//     return null
//   }
// }

export async function customModuleHandler(src: string[], option: BuildOptions): Promise<void> {
  const builder = [
    {
      entryPoints: src,
      bundle: true,
      minify: true,
      format: 'esm' as Format,
      ...option,
    },
  ]
  await startBuildServe(builder)
}
