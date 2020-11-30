import { build } from 'esbuild'
import log from 'loglevel'

export async function buildProfile(entry: string): Promise<string> {
  let result = await build({
    entryPoints: [entry],
    platform: 'node',
    target: ['es6'],
    write: false,
    outdir: 'out',
  })
  if (result?.outputFiles?.length) {
    const { contents } = result.outputFiles[0]
    // const aa = await import(path)
    const buf = Buffer.from(contents)
    log.info(Buffer.isBuffer(buf), buf.toString())
    return buf
  }
  return Promise.resolve('')
}
