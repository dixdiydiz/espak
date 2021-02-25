import esbuild, { BuildOptions } from 'esbuild'
import { isArray } from '../utils'

export async function buildServe(options: BuildOptions | BuildOptions[]) {
  if (!isArray(options)) {
    options = [options]
  }
  const service = await esbuild.startService()
  try {
    const promises = []
    for (let opt of options) {
      promises.push(service.build(opt))
    }
    return Promise.all(promises)
  } finally {
    service.stop()
  }
}
