import fs from 'fs-extra'
import path from 'path'
import log from 'loglevel'
import { buildConfig } from './transform/wrapEsbuild'
import { EspakPlugin } from './transform/fabrication'
import { isArray } from './utils'

export interface Resolve {
  alias?: Record<string, string>
  extensions: string[]
}
export interface UserConfig {
  public: string
  entry: string | Record<string, string> | string[]
  outputDir: string
  resolve: Resolve
  external: string[] | undefined
  plugins: EspakPlugin[]
}

export async function generateConfig(): Promise<UserConfig> {
  const prefix: string = 'espak.config'
  const supportedConfigExt: string[] = ['.json', '.js', '.ts']
  let userConfig: Partial<UserConfig> = Object.create(null)
  try {
    for (let ext of supportedConfigExt) {
      const profile = path.resolve(`${prefix}${ext}`)
      if (fs.pathExistsSync(profile)) {
        switch (ext) {
          case '.json':
          case '.js':
            userConfig = await import(profile)
            break
          case '.ts': {
            userConfig = await buildConfig(profile, prefix)
          }
        }
        break
      }
    }
  } catch (e) {
    log.error(e)
    log.warn('configuration file is not available, exit.')
    process.exit(1)
  }
  const {
    public: publicDir = './public',
    entry = 'src/index.js',
    outputDir = 'dist',
    external,
    plugins,
    resolve,
  } = userConfig
  const defaultResolve: Resolve = {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
  }
  return Object.freeze({
    public: publicDir,
    entry,
    outputDir,
    resolve: handleResovle(resolve, defaultResolve),
    external,
    plugins: isArray(plugins) ? plugins : [],
  })

  function handleResovle(resolve: Partial<Resolve> = {}, defaultResolve: Partial<Resolve> = {}): Resolve {
    const extensions = [...new Set([...(resolve.extensions || []), ...(defaultResolve.extensions || [])])]
    const result: Resolve = {
      extensions,
    }
    if (resolve.alias) {
      result.alias = resolve.alias
    }
    return result
  }
}
