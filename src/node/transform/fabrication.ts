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
import { createTempDist } from '../index'
import { isObject } from '../utils'

interface ResolveModuleResult {
  modulePath: string
  name: string
}
export function resolveModule(extensions: string[], alias: unknown, to: string, fromdir: string): ResolveModuleResult {
  if (alias && isObject(alias) && !/^(\.\/|\.\.\/)/.test(to)) {
    for (let [key, val] of Object.entries(alias)) {
      const reg = new RegExp(`^${key}`)
      if (reg.test(to)) {
        to = to.replace(reg, val)
        break
      }
    }
  }
  const modulePath = resolve.sync(to, {
    basedir: fromdir,
    extensions,
  })
  const { name } = path.parse(modulePath)
  return {
    modulePath,
    name,
  }
}

/**
 * rewrite esbuild plugin types
 * start
 */
export interface EspakOnResolveArgs extends OnResolveArgs {
  modulePath: string
}
export interface EspakBuildOptions extends BuildOptions {
  sourcePath?: string
  outputDir?: string
  outputExtension?: string
  fileName?: string
  key?: string
}
export interface EspakOnResolveResult extends OnResolveResult {
  outputOptions?: EspakBuildOptions
  buildOptions?: BuildOptions
}

interface OnResloveCallback {
  (args: EspakOnResolveArgs): EspakOnResolveResult | null | undefined | Promise<EspakOnResolveResult | null | undefined>
  plguinName?: string | null | undefined
}
interface OnLoadCallback {
  (args: OnLoadArgs): OnLoadResult | null | undefined | Promise<OnLoadResult | null | undefined>
  plguinName?: string | null | undefined
}

export interface PluginBuild {
  onResolve(options: OnResolveOptions, callback: OnResloveCallback): void
  onLoad(options: OnLoadOptions, callback: OnLoadCallback): void
}
export interface EspakPlugin {
  name: string
  setup: (build: PluginBuild) => void
  namespace?: string
}
interface OnLoadCallback {
  (args: OnLoadArgs): OnLoadResult | null | undefined | Promise<OnLoadResult | null | undefined>
  pluginName: string | undefined | null
}
type ResolveMap = Map<OnResolveOptions, OnResolveResult>

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
  onLoads: (args: OnLoadArgs, plugin: Plugin) => Promise<OnLoadResult | null | undefined>
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
      const { name = '', setup, namespace } = ele
      if (namespace) {
        namespaces.push(namespace)
      }
      setup({
        onResolve: onResolve(name),
        onLoad: onLoad(name),
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

  function onResolve(name: string) {
    return (options: OnResolveOptions, callback: OnResloveCallback): void => {
      const onResolveCallback = (args: any) => callback(args)
      onResolveCallback.pluginName = name
      resolveMap.set(options, onResolveCallback)
    }
  }
  function onLoad(name: string) {
    return (options: OnLoadOptions, callback: OnLoadCallback): void => {
      const onLoadCallback = (args: any) => callback(args)
      onLoadCallback.pluginName = name
      loadMap.set(options, onLoadCallback)
    }
  }
}

async function onResolves(
  resolveFn: (to: string, from: string) => ResolveModuleResult,
  resolveMap: ResolveMap,
  args: OnResolveArgs,
  esbuildPlugin: Plugin
): Promise<unknown> {
  const { path: rawModulePath, importer, resolveDir, namespace: importerNamespace } = args
  const dist: string = await createTempDist()
  // namespace default set to "file"
  for (let [{ filter, namespace = 'file' }, callback] of resolveMap) {
    const { modulePath, name } = resolveFn(rawModulePath, resolveDir)
    // match import path or absolute path
    if ([rawModulePath, modulePath].some((ele) => filter.test(ele)) && namespace === importerNamespace) {
      const rawResolveResult: EspakOnResolveResult | undefined | null = await (callback as Function)({
        ...args,
        modulePath,
      })
      const { resolveResult: ripeResolveResult, outputOptions, buildOptions } = verifyOnResolveResult(
        callback.pluginName,
        rawResolveResult
      )
      let relative: string = ''
      if (outputOptions) {
        const { sourcePath, fileName = '', key = '', outputDir = '', outputExtension = '.js' } = outputOptions
        const entry = sourcePath || modulePath
        if (infileToOutfile[entry]) {
          relative = convertRelativePath(infileToOutfile[importer], infileToOutfile[entry])
        } else {
          const outfile = path.resolve(dist, outputDir, `${fileName || name}${key ? `-${key}` : ''}${outputExtension}`)
          try {
            infileToOutfile[entry] = outfile
            await startBuildServe([
              {
                minify: true,
                format: 'esm' as Format,
                ...buildOptions,
                entryPoints: [entry],
                bundle: true,
                outfile,
                plugins: [esbuildPlugin],
              },
            ])
            relative = convertRelativePath(infileToOutfile[importer], infileToOutfile[entry])
          } catch (e) {
            log.error(e)
            process.exit(1)
          }
        }
      }
      return {
        ...ripeResolveResult,
        path: ripeResolveResult?.path || relative,
      }
    }
  }
  return null

  function convertRelativePath(importer: string, modulePath: string): string {
    const { dir } = path.parse(importer)
    const relative = path.relative(dir, modulePath)
    // if (!/\//.test(relative)) {
    //   return `./${relative}`
    // }
    return relative
  }
}

async function onLoads(
  resolveFn: (to: string, from: string) => ResolveModuleResult,
  loadMap: LoadMap,
  args: OnLoadArgs,
  esbuildPlugin: Plugin // not use yet
): Promise<OnLoadResult | null | undefined> {
  const { path: absoluteModulePath, namespace: moduleNamespace } = args

  for (let [{ filter, namespace }, callback] of loadMap) {
    if (filter.test(absoluteModulePath) && namespace === moduleNamespace) {
      const rawLoadResult: OnLoadResult | undefined | null = await (callback as Function)({
        ...args,
      })

      return {
        ...rawLoadResult,
      }
    }
  }
  return null
}

interface ClassifyEspakOnResolveResult extends Omit<EspakOnResolveResult, keyof OnResolveResult> {
  resolveResult: OnResolveResult
}
function verifyOnResolveResult(
  pluginName: string | undefined | null,
  resolveResult: unknown
): ClassifyEspakOnResolveResult {
  const support: string[] = ['path', 'external', 'namespace', 'errors', 'warnings', 'pluginName']
  const extraOptions: EspakOnResolveResult = {
    outputOptions: undefined,
    buildOptions: undefined,
  }
  let result: any = resolveResult
  if (isObject(resolveResult)) {
    result = Object.create(null)
    const extraOptionsKeys: string[] = Object.keys(extraOptions)
    for (let [key, val] of Object.entries(resolveResult)) {
      if (support.includes(key)) {
        result[key] = val
      } else if (extraOptionsKeys.includes(key)) {
        extraOptions[key as keyof typeof extraOptions] = val
      } else {
        log.error(
          `[plugin error]: Invalid option from onResolve() callback in plugin ${pluginName || 'unknown plugin'}: ${key}`
        )
        process.exit(1)
      }
    }
  }
  return {
    resolveResult: result,
    outputOptions: extraOptions.outputOptions,
    buildOptions: extraOptions.buildOptions,
  }
}

type PlainObject = { [key: string]: string }
const infileToOutfile: PlainObject = Object.create(null)
interface CustomBuildOption {
  dist: string
  plugins: Plugin[]
}
export async function entryHandler(src: string[], option: CustomBuildOption): Promise<void> {
  const { dist, plugins } = option
  const builder = src.map((entry) => {
    const { name } = path.parse(entry)
    const outfile = path.resolve(dist, 'src', `${name}.js`)
    infileToOutfile[entry] = outfile
    return {
      entryPoints: [entry],
      bundle: true,
      minify: true,
      format: 'esm' as Format,
      outfile,
      plugins,
    }
  })
  await startBuildServe(builder)
}
