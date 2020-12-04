import log from 'loglevel'
import resolve from 'resolve'
import path from 'path'
import { generateConfig, UserConfig } from '../config'
import { singleBuild } from '../transform/wrapEsBuild'
import { handleImportation } from '../transform/fabrication'

export async function command(): Promise<void> {
  const config: UserConfig = await generateConfig()
  const { entry: entrySnippet } = config
  for (let [key, val] of Object.entries(entrySnippet)) {
    const entry: string = resolve.sync(path.resolve('./', val), {
      basedir: process.cwd(),
    })
    const { base, ext } = path.parse(entry)
    if (['.tsx', '.ts', '.jsx', '.js'].includes(ext)) {
      const result = await singleBuild({
        entryPoints: [entry],
        bundle: false,
        minify: true,
        format: 'esm',
        write: false,
      })
      const promises: Promise<unknown>[] = []
      result &&
        (function () {
          for (let o of result.outputFiles!) {
            promises.push(
              handleImportation({
                in: entry,
                label: key,
                text: o.text,
              })
            )
          }
        })()
      await Promise.all(promises)
    } else {
      log.error(`entry file ext do not support ${ext}: ${base}`)
    }
  }
}
