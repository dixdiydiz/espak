import log from 'loglevel'
import path from 'path'
import resolve from 'resolve'
import fs from 'fs-extra'
import { generateConfig, UserConfig } from '../config'
import webModulePlugin from './webModulePlugin'
import { connectConfigHelper, constructEsbuildPlugin, entryHandler } from '../plugin-system/agency'
import proxyPlugin from '../plugin-system/proxyPlugin'

export async function command(dist: string): Promise<void> {
  const config: UserConfig = await generateConfig()
  const { entry: configEntry, plugins, outputDir } = config
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
  const modulePlugin = await connectConfigHelper<[string[]]>(webModulePlugin, ['external'])
  const plugin = await constructEsbuildPlugin(proxyPlugin, [modulePlugin, ...plugins], config)
  await entryHandler(entries, [plugin])
  const absoluteOutputDir = path.resolve(process.cwd(), outputDir)
  await cloneDist(dist, absoluteOutputDir)
}

async function cloneDist(from: string, to: string): Promise<void> {
  try {
    await fs.copy(from, to)
  } catch (e) {
    log.error(`output error: ${e}`)
    process.exit(1)
  }
}
