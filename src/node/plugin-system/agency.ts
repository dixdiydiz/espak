import resolve from 'resolve'
import log from 'loglevel'
import path from 'path'
import { UserConfig } from '../config'
// import { startBuildServe } from './wrapEsbuild'
import {
  build as esbuildBuild,
  Plugin as EsbuildPlugin,
  OnResolveOptions as EsbuildOnResolveOptions,
  OnResolveArgs as EsbuildOnResolveArgs,
  OnResolveResult as EsbuildOnResolveResult,
  OnLoadOptions as EsbuildOnLoadOptions,
  OnLoadArgs as EsbuildOnLoadArgs,
  OnLoadResult as EsbuildOnLoadResult,
  BuildOptions,
  BuildResult,
  BuildIncremental,
  OutputFile,
} from 'esbuild'
import { createTempDist } from '../index'
import { isObject } from '../utils'
import {Resolve} from '../config'

export interface ProxyPlugin {
  (
    proxyResolveAct: (args: EsbuildOnResolveArgs) => Promise<EsbuildOnResolveResult>,
    onLoads: (args: EsbuildOnLoadArgs) => Promise<EsbuildOnLoadResult>
  ): EsbuildPlugin | Promise<EsbuildPlugin>
}
interface OnResolveArgs {
  path: string
  absolutePath: string
  importer: string
  namespace: string
  resolveDir: string
}
interface OnResolveCallback {
  (args: OnResolveArgs): EsbuildOnResolveResult | null | undefined | Promise<EsbuildOnResolveResult | null | undefined>
  _pluginName?: string
}
interface OnLoadCallback {
  (args: EsbuildOnLoadArgs): EsbuildOnLoadResult | null | undefined | Promise<EsbuildOnLoadResult | null | undefined>
  _pluginName?: string
}
type HeelHookCallback = (pluginData: any) => any
type AllBuildResult = BuildResult | BuildIncremental | (BuildResult & { outputFiles: OutputFile[] })
export interface PluginBuild {
  onResolve(options: EsbuildOnResolveOptions, callback: OnResolveCallback): void
  onLoad(options: EsbuildOnLoadOptions, callback: OnLoadCallback): void
  heelHook(callback: HeelHookCallback): void
  triggerBuild(options: BuildOptions): Promise<AllBuildResult>
}

export interface Plugin {
  name: string
  setup: (build: PluginBuild) => void
}
/**
 * rewrite esbuild some inner interface
 * end
 */

export interface ConnectConfigHelper {
  (config: UserConfig): Promise<Plugin>
  _needConfig: boolean
}
type ValOfConfig<T> = T extends any[] ? T : T extends (...args: infer U) => Plugin | Promise<Plugin> ? U : T[]

export function connectConfigHelper<T = any[]>(
  callback: (...args: ValOfConfig<T>) => Plugin | Promise<Plugin>,
  args: string[]
): ConnectConfigHelper {
  const wrapPlugin = async (config: UserConfig) => {
    const valOfConfig: ValOfConfig<unknown[]> = args.map((keys) => {
      return keys.split('.').reduce((prev: any, curr: string) => (prev ? prev[curr] : prev), config)
    })
    return await callback(...(valOfConfig as ValOfConfig<T>))
  }
  wrapPlugin._needConfig = true
  return wrapPlugin
}

type PendingPlugin = ConnectConfigHelper | Plugin
type OnResolveMap = Map<EsbuildOnResolveOptions, OnResolveCallback>
type OnLoadMap = Map<EsbuildOnLoadOptions, OnLoadCallback>
type HeelHookSet = Set<HeelHookCallback>
type TriggerBuildPlugins = Set<EsbuildPlugin>
interface PluginDeconstruction {
  onResolveMap: OnResolveMap
  onLoadMap: OnLoadMap
  heelHookSet: HeelHookSet
  triggerBuildPlugins: TriggerBuildPlugins
}

async function decomposePlugin(pendingPlugins: PendingPlugin[], config: UserConfig): Promise<PluginDeconstruction> {
  const distDir = await createTempDist()
  const onResolveMap: OnResolveMap = new Map()
  const onLoadMap: OnLoadMap = new Map()
  const heelHookSet: HeelHookSet = new Set()
  const triggerBuildPlugins: TriggerBuildPlugins = new Set()
  for (let cb of pendingPlugins) {
    const { name = '', setup } = '_needConfig' in cb ? await cb(config) : cb
    try {
      setup({
        onResolve: onResolve(name),
        onLoad: onLoad(name),
        heelHook,
        triggerBuild: triggerBuild(name),
      })
    } catch (e) {
      log.error(`plugin ${name} error: ${e}`)
      process.exit(1)
    }
  }
  return {
    onResolveMap,
    onLoadMap,
    heelHookSet,
    triggerBuildPlugins,
  }
  function onResolve(name: string) {
    return (options: EsbuildOnResolveOptions, callback: OnResolveCallback): void => {
      callback._pluginName = name
      onResolveMap.set(options, callback)
    }
  }
  function onLoad(name: string) {
    return (options: EsbuildOnLoadOptions, callback: OnLoadCallback): void => {
      callback._pluginName = name
      onLoadMap.set(options, callback)
    }
  }
  function heelHook(cb: HeelHookCallback): void {
    heelHookSet.add(cb)
  }
  function triggerBuild(name: string) {
    return async (options: BuildOptions): Promise<AllBuildResult> => {
      const { outdir, outfile, plugins = [] } = options
      if (outdir) {
        options.outdir = path.join(distDir, outdir)
      }
      if (outfile) {
        options.outfile = path.join(distDir, outfile)
      }
      options.plugins = [...plugins, ...triggerBuildPlugins]
      try {
        return esbuildBuild(options)
      } catch (e) {
        log.error(`triggerBuild callback get some error in ${name} plugin`)
        log.error(e)
        process.exit(1)
      }
    }
  }
}
function aliasReplacer (alias: Pick<Resolve, 'alias'>) {
  let rege: RegExp = new RegExp('')
  if (isObject(alias)) {
    let pattern = ''
    for (let [key, val] of Object.entries(alias)) {
      pattern =
    }
  }
  return (path: string) => {
    return
  }
}

async function proxyResolveAct(
  aliasReplacer: (path: string) => string,
  extensions: string[],
  onResolveMap: OnResolveMap,
  args: EsbuildOnResolveArgs
): EsbuildOnResolveResult {
  const { path, resolveDir } = args
  let absolutePath: string = ''
  if (/^(\.\/|\.\.\/)/.test(path)) {
    absolutePath = resolve.sync(path, {
      basedir: resolveDir,
      extensions,
    })
  } else if ()
  const keys = isObject(alias) && Object.keys(alias)

}

export function constructEsbuildPlugin(
  proxyPlugin: ProxyPlugin,
  plugins: PendingPlugin[],
  config: UserConfig
): EsbuildPlugin {
  const onResolves = null
  const onLoads = null
  return proxyPlugin({
    onResolves,
    onLoads,
  })
}
