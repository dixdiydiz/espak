import log from 'loglevel'
import fs from 'fs-extra'
import { createTempDist } from '../index'

export interface GenerateIndexHtml {
  (html: string): string
  _pluginName?: string
}
interface nextChain {
  action: GenerateIndexHtml
  next: nextChain | null | undefined
}
interface firstChain extends nextChain {
  last: nextChain | firstChain
}
export let generateHtmlChain: firstChain
export function generateIndexHtmlHook(cb: GenerateIndexHtml): void {
  const nextChain = {
    action: cb,
    next: null,
  }
  if (generateHtmlChain) {
    generateHtmlChain.last.next = nextChain
    generateHtmlChain.last = nextChain
  } else {
    generateHtmlChain = {
      ...nextChain,
      last: generateHtmlChain,
    }
  }
}

export async function clonePublicDir(publicdir: string) {
  const distDir = await createTempDist()
  try {
    await fs.copy(publicdir, distDir, {
      overwrite: false,
    })
  } catch (e) {
    log.error(e)
    process.exit(1)
  }
}
