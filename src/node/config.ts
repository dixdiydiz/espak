import fs from 'fs-extra'
import path from 'path'
import log from 'loglevel'
import { buildProfile } from './transform/index'

export interface UserConfig {
  public?: string
  entry?: string | Record<string, string>
  output?: string
}

export async function generateConfig() {
  const supportedConfigExt: string[] = ['.json', '.js', '.ts']
  let userConfig = null
  try {
    for (let ext of supportedConfigExt) {
      const profile = path.resolve(`espak.config${ext}`)
      if (fs.pathExistsSync(profile)) {
        switch (ext) {
          case '.json':
          case '.js':
            userConfig = await import(profile)
            break
          case '.ts':
            userConfig = await buildProfile(profile)
            console.log('from config.ts',userConfig)
            break
        }
        break
      }
    }
  } catch (e) {
    log.error(e)
    log.warn('Because the configuration file is not available, the default configuration is used.')
  }

  // const defaultconfig: UserConfig = {
  //   public: './',
  //   entry: './src/',
  // }
}

// async function getUserconfig() {}
