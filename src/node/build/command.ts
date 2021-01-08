import log from 'loglevel'
import path from 'path'
import resolve from 'resolve'
import proxyPlugin from '../transform/proxyPlugin'
import { generateConfig, UserConfig } from '../config'
import { entryHandler, createPlugin } from '../transform/fabrication'
import webModulePlugin from '../transform/webModulePlugin'
import { isArray } from '../utils'

export async function command(dist: string): Promise<void> {
  const config: UserConfig = await generateConfig()
  const { entry: configEntry, external, plugins } = config
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
  const modulePlugin = await webModulePlugin(isArray(external) ? external : [])
  const combinePlugins = [modulePlugin, ...plugins]
  const plugin = await createPlugin(proxyPlugin, combinePlugins, config)
  await entryHandler(entries, {
    dist,
    plugins: [plugin],
  })
}
