import fs from 'fs-extra'
import path from 'path'
import log from 'loglevel'
import { BuildOptions } from 'esbuild'
import { buildConfig } from './transform/wrapEsBuild'
import { isFunction } from './utils'

export interface Resolve {
  extensions?: string[]
}
export interface UserConfig {
  public: string
  entry: string | Record<string, string> | string[]
  output: string
  resolve: Resolve
  esbuildOption?: BuildOptions
}

export let finalConfig: UserConfig
export let customBuildOption: Function

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
          case '.ts':
            userConfig = await buildConfig(profile, prefix)
        }
        break
      }
    }
  } catch (e) {
    log.error(e)
    log.warn('configuration file is not available, exit.')
    process.exit(1)
  }
  const defaultconfig: UserConfig = {
    public: '',
    entry: 'src/index.js',
    output: 'dist',
    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.js'],
    },
  }
  finalConfig = {
    ...defaultconfig,
    ...userConfig,
    resolve: handleResovle(defaultconfig.resolve, userConfig.resolve),
  }
  customBuildOption = produceEsbuildOption(userConfig.esbuildOption || {})
  return finalConfig

  function handleResovle(defaultResolve: Resolve = {}, newResolve: Resolve = {}): Resolve {
    const extensions = [...new Set([...(defaultResolve.extensions || []), ...(newResolve.extensions || [])])]
    return {
      extensions,
    }
  }
}
export type ProduceOptionCb = (relative: string, absolute: string) => BuildOptions

function produceEsbuildOption(option: BuildOptions | ProduceOptionCb): Function {
  try {
    if (isFunction(option)) {
      return (r: string, a: string): BuildOptions => {
        const primaryOpt = option(r, a)
        let define = primaryOpt?.define || {}
        define['process.env.NODE_ENV'] = process.env.NODE_ENV || 'production'
        return {
          define,
        }
      }
    } else {
      return () => {
        let define = option?.define || {}
        define['process.env.NODE_ENV'] = process.env.NODE_ENV || 'production'
        return {
          define,
        }
      }
    }
  } catch (e) {
    log.error(e)
    return () => ({
      define: {
        process: {
          env: {
            NODE_ENV: 'production',
          },
        },
      },
    })
  }
}
