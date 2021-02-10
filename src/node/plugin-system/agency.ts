import resolve from 'resolve'
import log from 'loglevel'
import path from 'path'
import fs from 'fs-extra'
import { UserConfig } from '../config'
import {
  Metadata,
  Plugin as EsbuildPlugin,
  OnResolveOptions as EsbuildOnResolveOptions,
  OnResolveArgs as EsbuildOnResolveArgs,
  OnResolveResult as EsbuildOnResolveResult,
  OnLoadOptions as EsbuildOnLoadOptions,
  OnLoadArgs as EsbuildOnLoadArgs,
  OnLoadResult as EsbuildOnLoadResult,
  BuildOptions,
  Format,
  startService,
  // BuildResult,
  // BuildIncremental,
  // OutputFile,
} from 'esbuild'
import { createTempDist } from '../index'
// import { MapModule } from './mapping'
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
  (args: OnResolveArgs): OnResolveResult | Promise<OnResolveResult>
  _pluginName?: string
}
type OnLoadResult = EsbuildOnLoadResult | null | undefined
interface OnLoadCallback {
  (args: EsbuildOnLoadArgs): OnLoadResult
  _pluginName?: string
}
type HeelHookCallback = (pluginData: any) => any
// type AllBuildResult = BuildResult | BuildIncremental | (BuildResult & { outputFiles: OutputFile[] })
export interface PluginBuild {
  onResolve(options: EsbuildOnResolveOptions, callback: OnResolveCallback): void
  onLoad(options: EsbuildOnLoadOptions, callback: OnLoadCallback): void
  heelHook(callback: HeelHookCallback): void
  triggerBuild(options: BuildOptions): Promise<any> // todo
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

export type PendingPlugin = ConnectConfigHelper | Plugin
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
    return async (
      options: TriggerBuildOptions | TriggerBuildOptions[],
      rewrite: boolean = false
    ): Promise<Metadata> => {
      if (!isArray(options)) {
        options = [options]
      }
      try {
        for (let opt of options) {
          const { entryPoints, outfile, plugins = [] } = opt
          if (isArray(entryPoints)) {
            if (entryPoints.length > 1) {
              log.warn('triggerBuild only support build one file once. other files will be ignored.')
            }
            opt.entryPoints = entryPoints.slice(0, 1)
          }
          Reflect.deleteProperty(opt, 'outdir')
          if (outfile) {
            opt.outfile = path.join(distDir, outfile)
            opt.plugins = [...plugins, ...triggerBuildPlugins]
          }
        }
        const metafile = path.join(distDir, 'meta.json')
        const meta: Metadata = await narrowBuild(name, options, metafile)
        console.log(meta)
        return meta
      } catch (e) {
        log.error(`triggerBuild callback get some error in ${name} plugin`)
        log.error(e)
        process.exit(1)
      }
    }
  }
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

async function narrowBuild(
  mark: string,
  options: BuildOptions[],
  metafile: string,
  rewrite: boolean = false
): Promise<Metadata> {
  let metadata: Metadata = { inputs: {}, outputs: {} }
  try {
    // options = options
    //   .filter((opt) => {
    //     if (opt.entryPoints?.length) {
    //       const input = opt.entryPoints![0]
    //       const mod = MapModule._cache[input]
    //       if (mod) {
    //         result[input] = mod.outfile
    //         return false
    //       }
    //       const mod = new MapModule(input)
    //       mod.addCache()
    //       mod.outfile = opt.outfile || ''
    //       result[input] = mod.outfile
    //       return true
    //     }
    //     return false
    //   })
    //   .map((opt) => ({
    //     ...opt,
    //     metafile,
    //   }))
    options = options.map((opt) => ({
      ...opt,
      metafile,
    }))
    const service = await startService()
    const promises = []
    for (let opt of options) {
      promises.push(
        service.build(opt).then((res) => {
          const data: Metadata = JSON.parse(fs.readFileSync(metafile, 'utf-8'))
          const { inputs, outputs } = metadata
          metadata = {
            inputs: {
              ...inputs,
              ...data.inputs,
            },
            outputs: {
              ...outputs,
              ...data.outputs,
            },
          }
        })
      )
    }
    await Promise.all(promises)
    return metadata
  } catch (e) {
    log.error(`build error in ${mark}:`)
    log.error(e)
    process.exit(1)
  }
}

export async function entryHandler(srcs: string[], plugins: EsbuildPlugin[]): Promise<void> {
  const distDir = await createTempDist()
  const options = srcs.map((src) => {
    const { name } = path.parse(src)
    const outfile = path.resolve(distDir, 'src', `${name}.js`)
    return {
      entryPoints: [src],
      bundle: true,
      minify: true,
      format: 'esm' as Format,
      outfile,
      plugins,
    }
  })
  const metafile = path.join(distDir, 'meta.json')
  await narrowBuild('entry file', options, metafile)
}
