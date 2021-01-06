import log from 'loglevel'
import path from 'path'
import resolve from 'resolve'
import { TempDist } from '../index'
import plainPlugin from '../transform/plainPlugin'
import { generateConfig, UserConfig } from '../config'
import { customModuleHandler, createPlugin } from '../transform/fabrication'

export async function command(dist: TempDist): Promise<void> {
  const config: UserConfig = await generateConfig()
  const { entry: configEntry, plugins } = config
  const supportedExtensions = ['.tsx', '.ts', '.jsx', '.js']
  const entries = []
  for (let [_, val] of Object.entries(configEntry)) {
    const infile = resolve.sync(path.resolve('./', val), {
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
  const simplePlugin = await createPlugin(plainPlugin, plugins, config)
  await customModuleHandler(entries, {
    dist,
    plugins: [simplePlugin],
  })
}
