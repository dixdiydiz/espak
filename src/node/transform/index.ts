import { build, BuildOptions, startService } from 'esbuild'
import log from 'loglevel'
import fs from 'fs-extra'
import path from 'path'
import {espakTemp} from '../index'


export async function buildConfig (profile: string, prefix: string): Promise<object> {
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

export async function startBuildServe(source: string[] ,options: BuildOptions) {
  const service = await startService()
  try {
    const result = []
    result.push(service.build(options))
    // for (let s of source) {
    // }
    await Promise.all(result)
  } catch(e) {
    log.error(e)
  } finally {
    service.stop()
  }
}