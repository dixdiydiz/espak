import log from 'loglevel'
import path from 'path'
import fs from 'fs-extra'
import {espakTemp} from '../index'
import { generateConfig, UserConfig } from '../config'
import {startBuildServe} from '../transform/index'
interface AllSrc {
  entry: Record<string,any>
  module: Record<string,any>
}
export async function command(): Promise<void> {
  const config: UserConfig = await generateConfig()
  const dispenser: Partial<AllSrc> = {entry: {}}
  const {entry: entrySnippet} = config 
  for (let [key, val] of Object.entries(entrySnippet)) {
    const entry: string = path.resolve(process.cwd(), val)
    const content = await fs.readFile(entry, 'utf8').catch(log.error)
    dispenser.entry![entry] = {
      key,
      content
    }
    await startBuildServe([], {
      entryPoints: [entry],
      bundle: false,
      outdir: espakTemp,
      outbase: process.cwd()
    })
  }
}
