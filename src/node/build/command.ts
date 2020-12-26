import log from 'loglevel'
import path from 'path'
import { generateConfig, UserConfig } from '../config'
import { resolveModule, customModuleHandler, globalModulePlugins } from '../transform/fabrication'

export async function command(): Promise<void> {
  const config: UserConfig = await generateConfig()
  const { entry: configEntry } = config
  const supportedExtensions = ['.tsx', '.ts', '.jsx', '.js']
  const entries = []
  for (let [_, val] of Object.entries(configEntry)) {
    const infile = resolveModule(path.resolve('./', val), {
      basedir: process.cwd(),
      extensions: supportedExtensions,
    })
    if (infile) {
      const { ext } = path.parse(infile)
      if (supportedExtensions.includes(ext)) {
        entries.push(infile)
      } else {
        log.error(`entry file ext do not support ${ext}: ${infile}`)
      }
    }
  }
  await customModuleHandler(entries)
}
