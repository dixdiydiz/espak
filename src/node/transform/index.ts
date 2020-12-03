import { build, BuildOptions, startService, Plugin } from 'esbuild'
import log from 'loglevel'
import fs from 'fs-extra'
import path from 'path'
import { espakTemp } from '../index'
import globalCssPlugin from './globalCssPlugin'
import reactPlugin from './reactPlugin'

export const commonPlugins: Plugin[] = [globalCssPlugin, reactPlugin]

export async function buildConfig(profile: string, prefix: string): Promise<object> {
  const tmpPath: string = path.join(espakTemp, `${prefix}.js`)
  await build({
    entryPoints: [profile],
    platform: 'node',
    format: 'cjs',
    outdir: espakTemp,
  })
  const config: any = await import(tmpPath)
  fs.removeSync(tmpPath)
  return config.default || config
}

export async function startBuildServe(options: BuildOptions[]) {
  const service = await startService()
  try {
    const promises = []
    for (let o of options) {
      const plugins: Plugin[] = o.plugins ? [...commonPlugins, ...o.plugins] : commonPlugins
      promises.push(
        service.build({
          ...o,
          plugins,
        })
      )
    }
    return await Promise.all(promises)
  } catch (e) {
    log.error(e)
  } finally {
    service.stop()
  }
}
