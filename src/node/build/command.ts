import log from 'loglevel'
import path from 'path'
import { generateConfig, UserConfig } from '../config'
import {
  ModuleFlag,
  resolveModule,
  RawInModule,
  MedInModule,
  earlierCustomModuleHandler,
  handleImportation,
} from '../transform/fabrication'

export async function command(): Promise<void> {
  const config: UserConfig = await generateConfig()
  const { entry: configEntry } = config
  const supportedExtensions = ['.tsx', '.ts', '.jsx', '.js']
  const entries = []
  for (let [key, val] of Object.entries(configEntry)) {
    const entry: Partial<MedInModule> & RawInModule = {
      ...resolveModule(path.resolve('./', val), {
        basedir: process.cwd(),
        extensions: supportedExtensions,
      }),
      moduleFlag: ModuleFlag.CUSTOM, // entry file treat as custom module
      label: key,
    }
    if (supportedExtensions.includes(entry.ext!)) {
      entries.push({
        src: entry,
      })
    } else {
      log.error(`entry file ext do not support ${entry.ext}: ${entry.pathSource}`)
    }
  }
  const handleResult: (RawInModule & Partial<MedInModule>)[] = await earlierCustomModuleHandler(entries)
  for (let r of handleResult) {
    await handleImportation(r)
  }
}
