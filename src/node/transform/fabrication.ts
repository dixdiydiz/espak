import resolve from 'resolve'
import log from 'loglevel'
import path from 'path'
import { UserConfig } from '../config'
import { startBuildServe } from './wrapEsbuild'
import { BuildOptions, Format, Plugin } from 'esbuild'
import { createTempDist, TempDist } from '../index'
import { isObject } from '../utils'

export interface ResolveOptions {
  basedir?: string
  extensions?: string[]
  includeCoreModules?: boolean
}

export function resolveModule(extensions: string[], alias: unknown, to: string, from: string): string {
  if (alias && isObject(alias) && !/^(\.\/|\.\.\/)/.test(to)) {
    for (let [key, val] of Object.entries(alias)) {
      const reg = new RegExp(`^${key}`)
      if (reg.test(to)) {
        to = to.replace(reg, val)
        break
      }
    }
  }
  const { dir: basedir } = path.parse(from)
  const res = resolve.sync(to, {
    basedir,
    extensions,
  })
  return res
}

export interface BuildUtil {
  buildServe: typeof startBuildServe
  config: UserConfig
  dist: TempDist
}
export type EspakPlugin = (
  util: BuildUtil,
  resolveModule: (to: string, from: string) => string,
  arg?: unknown
) => Plugin | Promise<Plugin>

export async function createPlugins(plugins: EspakPlugin[], config: UserConfig, ...args: any[]): Promise<Plugin[]> {
  const dist = await createTempDist()
  const {
    resolve: { extensions, alias },
  } = config
  const esbuildPlugins = await Promise.all(
    plugins.map((fn) =>
      exceptionHandle(
        fn,
        {
          dist,
          buildServe: startBuildServe,
          config,
        },
        resolveModule.bind(null, extensions, alias),
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
