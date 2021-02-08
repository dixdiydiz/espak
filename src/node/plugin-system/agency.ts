import resolve from 'resolve'
import log from 'loglevel'
import path from 'path'
import { UserConfig } from '../config'
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
import { MapModule } from './mapping'
import { isObject, isArray } from '../utils'

export interface ProxyPlugin {
  (
    proxyResolveAct: (args: EsbuildOnResolveArgs) => Promise<OnResolveResult>,
    proxyLoadAct: (args: EsbuildOnLoadArgs) => Promise<OnLoadResult>
  ): EsbuildPlugin | Promise<EsbuildPlugin>
}
interface OnResolveArgs {
  path: string
  absolutePath: string
  importer: string
  namespace: string
  resolveDir: string
}
type OnResolveResult = EsbuildOnResolveResult | null | undefined
interface OnResolveCallback {
  (args: OnResolveArgs): OnResolveResult
  _pluginName?: string
}
type OnLoadResult = EsbuildOnLoadResult | null | undefined
interface OnLoadCallback {
  (args: EsbuildOnLoadArgs): OnLoadResult
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

export type TriggerBuildOptions = Omit<BuildOptions, 'outdir'>
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
    /**
     * only support build one file, don't use outdir.
     * */
    return async (options: TriggerBuildOptions | TriggerBuildOptions[]): Promise<AllBuildResult> => {
      if (!isArray(options)) {
        options = [options]
      }
      try {
        for (let opt of options) {
          const { outfile, plugins = [] } = opt
          Reflect.deleteProperty(opt, 'outdir')
          if (outfile) {
            opt.outfile = path.join(distDir, outfile)
            opt.plugins = [...plugins, ...triggerBuildPlugins]
          }
        }
      } catch (e) {
        log.error(`triggerBuild callback get some error in ${name} plugin`)
        log.error(e)
        process.exit(1)
      }
    }
  }
}
function aliasReplacer(alias: unknown): (path: string) => string {
  if (isObject(alias)) {
    const rege: RegExp = new RegExp(
      Object.keys(alias).reduce((prev, curr) => {
        return `${prev}|^${curr}`
      }, '^\\b$')
    )
    return (path) => path.replace(rege, (match) => alias[match])
  }
  return (path) => path
}

async function proxyResolveAct(
  aliasReplacer: (path: string) => string,
  extensions: string[],
  onResolveMap: OnResolveMap,
  heelHookSet: HeelHookSet,
  args: EsbuildOnResolveArgs
): Promise<OnResolveResult> {
  const { path, namespace, resolveDir, pluginData } = args
  const aliasPath = aliasReplacer(path)
  const absolutePath = resolve.sync(aliasPath, {
    basedir: resolveDir,
    extensions,
  })
  let result: OnResolveResult
  for (let [{ filter, namespace: pluginNamespace }, callback] of onResolveMap) {
    if ((pluginNamespace && namespace !== pluginNamespace) || !filter.test(absolutePath)) {
      continue
    }
    heelHookSet.clear()
    result = await callback({
      ...args,
      absolutePath,
    })
    if (isObject(result)) {
      result.pluginName = callback._pluginName
      // If path not set, esbuild will continue to run on-resolve callbacks that were registered after the current one.
      if (result.path) {
        for (let hook of heelHookSet) {
          await hook(pluginData)
        }
        return result
      }
    }
    // else continue
  }
  return result
}
async function proxyLoadAct(
  onLoadMap: OnLoadMap,
  heelHookSet: HeelHookSet,
  args: EsbuildOnLoadArgs
): Promise<OnLoadResult> {
  const { path, pluginData, namespace } = args
  let result: OnLoadResult
  for (let [{ filter, namespace: pluginNamespace }, callback] of onLoadMap) {
    if ((pluginNamespace && namespace !== pluginNamespace) || !filter.test(path)) {
      continue
    }
    heelHookSet.clear()
    result = await callback({ ...args })
    if (isObject(result)) {
      // If this is not set, esbuild will continue to run on-load callbacks that were registered after the current one
      if (result.contents) {
        for (let hook of heelHookSet) {
          await hook(pluginData)
        }
        return result
      }
    }
    // else continue
  }
  return result
}

export async function constructEsbuildPlugin(
  proxyPlugin: ProxyPlugin,
  plugins: PendingPlugin[],
  config: UserConfig
): Promise<EsbuildPlugin> {
  const {
    resolve: { alias, extensions },
  } = config
  const replacer = aliasReplacer(alias)
  const { onResolveMap, onLoadMap, heelHookSet, triggerBuildPlugins } = await decomposePlugin(plugins, config)
  const esbuildPlugin = await proxyPlugin(
    proxyResolveAct.bind(null, replacer, extensions, onResolveMap, heelHookSet),
    proxyLoadAct.bind(null, onLoadMap, heelHookSet)
  )
  triggerBuildPlugins.add(esbuildPlugin)
  return esbuildPlugin
}
