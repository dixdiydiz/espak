import log from 'loglevel'
import fs from 'fs-extra'
import { createTempDist } from '../index'
import path from 'path'

export interface GenerateIndexHtml {
  (html: string): string
  _pluginName: string
}
interface NextChain {
  action: GenerateIndexHtml
  next: NextChain | null | undefined
}
interface FirstChain extends NextChain {
  last: NextChain | FirstChain
}
export let generateHtmlChain: FirstChain
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

async function clonePublicDir(publicDir: string) {
  const distDir = await createTempDist()
  try {
    await fs.copy(publicDir, distDir, {
      overwrite: false,
    })
  } catch (e) {
    log.error(e)
    process.exit(1)
  }
}

export async function overWriteHtml(publicDir: string) {
  if (publicDir) {
    await clonePublicDir(publicDir)
  }
  try {
    const indexPath = path.join(publicDir, 'index.html')
    let chain: FirstChain | NextChain | null | undefined = generateHtmlChain
    if (chain) {
      let content = fs.readFileSync(indexPath, 'utf8')
      do {
        content = chain.action(content)
        chain = chain.next
      } while (chain)
      await fs.outputFile(indexPath, content)
    }
  } catch (e) {
    log.error(e)
    process.exit(1)
  }
}
