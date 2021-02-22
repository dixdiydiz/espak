import resolve from 'resolve'
import log from 'loglevel'
import path from 'path'
import fs from 'fs-extra'
import { UserConfig } from '../config'
import {
  Plugin as EsbuildPlugin,
  OnResolveOptions,
  OnResolveArgs as EsbuildOnResolveArgs,
  OnResolveResult,
  OnLoadOptions,
  OnLoadArgs,
  OnLoadResult,
  BuildOptions as EsbuildBuildOptions,
  Format,
  startService,
} from 'esbuild'
import { createTempDist } from '../index'
import { MapModule } from './mapping'
import { GenerateIndexHtml, generateIndexHtmlHook, overWriteHtml } from './extendPlugin'
import { isObject, isArray, formatBytes, isFunction } from '../utils'

export interface ProxyPlugin {
  (
    proxyResolveAct: (args: EsbuildOnResolveArgs) => Promise<OnResolveResult>,
    proxyLoadAct: (args: OnLoadArgs) => Promise<OnLoadResult>
  ): EsbuildPlugin
}
interface OnResolveArgs extends EsbuildOnResolveArgs {
  absolutePath: string
  importerOutfile: string
}

interface OnResolveCallback {
  (args: OnResolveArgs): OnResolveResult | Promise<OnResolveResult>
  _pluginName?: string
}
interface OnLoadCallback {
  (args: OnLoadArgs): OnLoadResult
  _pluginName?: string
}
type HeelHookCallback = (pluginData: any) => any
export interface BuildOptions extends Omit<EsbuildBuildOptions, 'outdir' | 'outbase'> {
  entryPoints: [string]
  outfile: string
}
export interface PluginBuild {
  onResolve(options: OnResolveOptions, callback: OnResolveCallback): void
  onLoad(options: OnLoadOptions, callback: OnLoadCallback): void
  heelHook(callback: HeelHookCallback): void
  triggerBuild(options: BuildOptions): Promise<Record<string, MapModule>>
}

export interface Plugin {
  name?: string
  setup?: (build: PluginBuild) => void
  generateIndexHtml?: Partial<GenerateIndexHtml>
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
    return callback(...(valOfConfig as ValOfConfig<T>))
  }
  wrapPlugin._needConfig = true
  return wrapPlugin
}

export type PendingPlugin = ConnectConfigHelper | Plugin
type OnResolveMap = Map<OnResolveOptions, OnResolveCallback>
type OnLoadMap = Map<OnLoadOptions, OnLoadCallback>
type HeelHookSet = Set<HeelHookCallback>
type TriggerBuildPlugins = Set<EsbuildPlugin>
interface PluginDeconstruction {
  onResolveMap: OnResolveMap
  onLoadMap: OnLoadMap
  heelHookSet: HeelHookSet
  triggerBuildPlugins: TriggerBuildPlugins
}

async function decomposePlugin(pendingPlugins: PendingPlugin[], config: UserConfig): Promise<PluginDeconstruction> {
  const onResolveMap: OnResolveMap = new Map()
  const onLoadMap: OnLoadMap = new Map()
  const heelHookSet: HeelHookSet = new Set()
  const triggerBuildPlugins: TriggerBuildPlugins = new Set()
  for (let cb of pendingPlugins) {
    const { name = '', setup, generateIndexHtml } = '_needConfig' in cb ? await cb(config) : cb
    try {
      if (setup) {
        setup({
          onResolve: onResolve(name),
          onLoad: onLoad(name),
          heelHook,
          triggerBuild: triggerBuild(name),
        })
      }
      if (isFunction(generateIndexHtml)) {
        generateIndexHtml._pluginName = name
        generateIndexHtmlHook(generateIndexHtml as GenerateIndexHtml)
      }
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
    return (options: OnResolveOptions, callback: OnResolveCallback): void => {
      callback._pluginName = name
      onResolveMap.set(options, callback)
    }
  }
  function onLoad(name: string) {
    return (options: OnLoadOptions, callback: OnLoadCallback): void => {
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
      options: BuildOptions | BuildOptions[],
      overwrite: boolean = false
    ): Promise<Record<string, MapModule>> => {
      options = isArray(options) ? options : [options]
      options.forEach((opt) => {
        const { plugins = [] } = opt
        opt.plugins = [...plugins, ...triggerBuildPlugins]
      })
      return narrowBuild(`plugin ${name}`, options, overwrite)
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
  let result: OnResolveResult = {}
  for (let [{ filter, namespace: pluginNamespace }, callback] of onResolveMap) {
    if ((pluginNamespace && namespace !== pluginNamespace) || !(filter.test(path) || filter.test(absolutePath))) {
      continue
    }
    heelHookSet.clear()
    result = await callback({
      ...args,
      absolutePath,
      importerOutfile: args.importer ? MapModule._cache[args.importer].outfile : '',
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

async function proxyLoadAct(onLoadMap: OnLoadMap, heelHookSet: HeelHookSet, args: OnLoadArgs): Promise<OnLoadResult> {
  const { path, pluginData, namespace } = args
  let result: OnLoadResult = {}
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
  const esbuildPlugin = proxyPlugin(
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
  errorMarkup: string,
  options: BuildOptions[],
  overwrite: boolean = false
): Promise<Record<string, MapModule>> {
  const result = Object.create(null)
  try {
    const service = await startService()
    const promises: Promise<any>[] = []
    options
      .filter((opt) => {
        const id = opt.entryPoints[0]
        const mod = MapModule._cache[id]
        if (!overwrite && mod?.write) {
          result[id] = mod
          return false
        }
        return true
      })
      .forEach((opt) => {
        const infile = opt.entryPoints[0]
        const outfile = (opt.outfile = fileToOutfile(opt.outfile))
        const mod = new MapModule(infile, outfile)
        promises.push(
          service
            .build({
              ...opt,
              minify: true,
              keepNames: true,
              write: false,
            })
            .then((res) => {
              if (res?.outputFiles.length) {
                for (let i = 0; i < res.outputFiles.length; i++) {
                  const { path, contents } = res.outputFiles[i]
                  mod.size = formatBytes(contents.byteLength)
                  fs.outputFileSync(path, contents)
                  mod.write = true
                  result[infile] = mod
                }
              }
            })
        )
      })

    await Promise.all(promises)
    return result
  } catch (e) {
    log.error(`build error in ${errorMarkup}:`)
    log.error(e)
    process.exit(1)
  }
}

export async function entryHandler(srcs: string[], plugins: EsbuildPlugin[], publicDir: string): Promise<void> {
  const options: BuildOptions[] = srcs.map((src) => {
    const outfile = fileToOutfile(src, '.js')
    return {
      entryPoints: [src],
      bundle: true,
      format: 'esm' as Format,
      outfile,
      plugins,
    }
  })
  await narrowBuild('entry file', options)
  await overWriteHtml(publicDir)
}

export function fileToOutfile(src: string, ext?: string) {
  const dist = createTempDist()
  if (src.includes(dist)) {
    return src
  }
  const { dir, name, ext: originExt } = path.parse(src)
  const splitdir = dir.split(process.cwd())
  const midpath = splitdir[0].length ? splitdir[0] : splitdir[1]
  ext = ext ?? originExt
  return path.join(dist, midpath, `${name}${ext}`)
}
