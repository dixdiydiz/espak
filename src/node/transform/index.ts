import { build } from 'esbuild'
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