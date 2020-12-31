import { build, BuildOptions, BuildResult, Service, startService } from 'esbuild'
import log from 'loglevel'
import os from 'os'
import fs from 'fs-extra'
import path from 'path'

// TODO：需要模拟成一个模块，以可以处理引入的全局模块。(相对路径模块直接bundle)
export async function buildConfig(profile: string, prefix: string): Promise<object> {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'espak-'))
  const tmpPath: string = path.join(tempDir, `${prefix}.js`)
  await build({
    entryPoints: [profile],
    platform: 'node',
    format: 'cjs',
    outfile: tmpPath,
  })
  const config: any = await import(tmpPath)
  fs.removeSync(tempDir)
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
