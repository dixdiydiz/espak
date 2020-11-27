import fs from 'fs-extra'
import path from 'path'
import log from 'loglevel'
// import os from 'os'

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
            userConfig = await import(profile)
            console.log(userConfig)
            break
        }
        break
      }
    }
  } catch (e) {
    log.error(e)
    log.warn('Because the configuration file is not available, the default configuration is used.')
  }

  const defaultconfig: UserConfig = {
    public: './',
    entry: './src/',
  }
}

async function getUserconfig() {}
