import log from 'loglevel'
import path from 'path'
import { generateConfig, UserConfig } from '../config'
import { singleBuild } from '../transform/wrapEsBuild'
import { resolveModule, RawInModule, MedInModule, handleImportation } from '../transform/fabrication'

export async function command(): Promise<void> {
  const config: UserConfig = await generateConfig()
  const { entry: entrySnippet } = config
  const supportedExtensions = ['.tsx', '.ts', '.jsx', '.js']
  for (let [key, val] of Object.entries(entrySnippet)) {
    const entry: Partial<MedInModule> & RawInModule = resolveModule({
      pathSource: path.resolve('./', val),
      basedir: process.cwd(),
      extensions: supportedExtensions,
    })
    entry.label = key
    if (supportedExtensions.includes(entry.ext!)) {
      const result = await singleBuild({
        entryPoints: [entry.infile],
        bundle: false,
        minify: true,
        format: 'esm',
        write: false,
      })
      if (result && result?.outputFiles?.length) {
        entry.text = result.outputFiles[0].text || ''
        await handleImportation(entry as RawInModule & MedInModule)
      } else {
        log.warn('some error, maybe entry file is a empty file?')
      }
    } else {
      log.error(`entry file ext do not support ${entry.ext}: ${entry.pathSource}`)
    }
  }
}
