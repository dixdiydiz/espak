import resolve from 'resolve'
import log from 'loglevel'
import { UserConfig } from '../config'
import { startBuildServe } from './wrapEsbuild'
import { BuildOptions, Format, Plugin } from 'esbuild'
import { createTempDist, TempDist } from '../index'

export interface ResolveOptions {
  basedir?: string
  extensions?: string[]
  includeCoreModules?: boolean
}

export function resolveModule(pathSource: string, options: ResolveOptions): string {
  const infile = resolve.sync(pathSource, options)
  return infile
}

export interface BuildUtil {
  buildServe: typeof startBuildServe
  config: UserConfig
  dist: TempDist
}
export type EspakPlugin = (util: BuildUtil, arg?: unknown) => Plugin | Promise<Plugin>

export async function createPlugins(plugins: EspakPlugin[], config: UserConfig, ...args: any[]): Promise<Plugin[]> {
  const dist = await createTempDist()
  const esbuildPlugins = await Promise.all(
    plugins.map((fn) =>
      exceptionHandle(
        fn,
        {
          dist,
          buildServe: startBuildServe,
          config,
        },
        ...args
      )
    )
  )
  return esbuildPlugins.filter((ele) => ele) as Plugin[]
}

async function exceptionHandle(fn: Function, ...args: any[]): Promise<Plugin | null> {
  try {
    return await fn(...args)
  } catch (e) {
    log.error(e)
    return null
  }
}

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
