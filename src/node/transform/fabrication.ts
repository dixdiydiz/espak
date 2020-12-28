// import { builtinModules } from 'module'
import resolve from 'resolve'
import log from 'loglevel'
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

export type EspakPlugin = (dist: TempDist, service: typeof startBuildServe) => Plugin | Promise<Plugin>
export async function createPlugins(plugins: EspakPlugin[]): Promise<Plugin[]> {
  console.log('plugins:---', plugins)
  const dist = await createTempDist()
  const esbuildPlugins = await Promise.all(plugins.map((fn) => exceptionHandle(fn, dist, startBuildServe)))
  return esbuildPlugins.filter((ele) => ele)
}
async function exceptionHandle(fn: Function, ...args: any[]) {
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
