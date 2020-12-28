import log from 'loglevel'
import path from 'path'
import { TempDist } from '../index'
import { isArray } from '../utils'
import webModulePlugin from '../transform/webModulePlugin'
import { generateConfig, UserConfig } from '../config'
import { resolveModule, customModuleHandler, createPlugins } from '../transform/fabrication'

export async function command(dist: TempDist): Promise<void> {
  const config: UserConfig = await generateConfig()
  const { entry: configEntry, external, plugins: customPlugins } = config
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
  const rawPlugin = await webModulePlugin(isArray(external) ? external : [])
  const plugins = await createPlugins([rawPlugin, ...customPlugins])
  await customModuleHandler(entries, {
    outdir: dist.tempSrc,
    outbase: 'src',
    plugins,
  })
}
