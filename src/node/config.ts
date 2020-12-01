import fs from 'fs-extra'
import path from 'path'
import log from 'loglevel'
import {buildConfig} from './transform/index'

export interface UserConfig {
  public?: string
  entry?: string | Record<string, string>
  output?: string
}

export async function generateConfig() {
  const prefix = 'espak.config'
  const supportedConfigExt: string[] = ['.json', '.js', '.ts']
  let userConfig = Object.create(null)
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
            userConfig =  await buildConfig(profile, prefix)
            console.log('userConfig:---', userConfig)
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
    public: './',
    entry: './src/',
  }
}

// async function getUserconfig() {}
