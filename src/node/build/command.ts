import log from 'loglevel'
import resolve from 'resolve'
import path from 'path'
// import fs from 'fs-extra'
import { BuildOptions } from 'esbuild'
import { espakTempSrc } from '../index'
import { generateConfig, UserConfig } from '../config'
import { startBuildServe } from '../transform'
interface OutInfo {
  label?: string
  dir?: string
  fileName?: string
  outdir?: string
}
export async function command(): Promise<void> {
  const config: UserConfig = await generateConfig()
  const dispenser: Record<string, OutInfo> = {}
  const buildOptions: BuildOptions[] = []
  const { entry: entrySnippet } = config
  for (let [key, val] of Object.entries(entrySnippet)) {
    const entry: string = resolve.sync(path.resolve('./', val), {
      basedir: process.cwd(),
    })
    const { dir, name, ext } = path.parse(entry)
    if (['.tsx', '.ts', '.jsx', '.js'].includes(ext)) {
      buildOptions.push({
        entryPoints: [entry],
        bundle: true,
        external: ['react', 'react-dom'],
        minify: false, // Usually you minify code in production but not in development.
        format: 'esm',
        outfile: path.join(espakTempSrc, `${name}-${key}.js`),
      })
      dispenser[entry] = {
        label: key,
        dir,
        fileName: name,
      }
    } else {
      log.error(`entry file ext do not support ${ext}`)
    }
  }
  await startBuildServe(buildOptions)
}
