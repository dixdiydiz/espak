import { build, BuildOptions, BuildResult, Service, startService } from 'esbuild'
import log from 'loglevel'
import fs from 'fs-extra'
import path from 'path'
import { espakTemp } from '../index'

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

export async function singleBuild(option: BuildOptions): Promise<BuildResult> {
  return await build(option)
}
export async function startBuildServe(options: BuildOptions[]): Promise<BuildResult[]> {
  const service: Service = await startService()
  try {
    const promises = []
    for (let o of options) {
      promises.push(service.build(o))
    }
    return await Promise.all(promises)
  } catch (e) {
    log.error(e)
    return []
  } finally {
    service.stop()
  }
}
