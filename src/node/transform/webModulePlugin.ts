import { EspakPlugin } from '../index'
import { resolveModule } from './fabrication'
import log from 'loglevel'
import { isArray } from '../utils'

const webModulePlugin: (external: string[]) => Promise<EspakPlugin> = async (external) => {
  const path = await resolveModule('./package.json', {
    basedir: process.cwd(),
  })
  const packageDependencies: string[] = await import(path)
    .then((r) => {
      const { dependencies = {} } = r
      return Object.keys(dependencies)
    })
    .catch((e) => {
      log.error(e)
      return []
    })
  const onResolveItems: string[] = isArray(external)
    ? packageDependencies.filter((ele) => !external.includes(ele))
    : packageDependencies
  return (dist, service) => {
    onResolveItems.forEach((ele) => {})
    console.log(onResolveItems, dist, service)
    return {
      name: 'webModulePlugin',
      setup({ onResolve }) {
        onResolveItems.forEach((ele) => {
          onResolve({ filter: new RegExp(`^${ele}$`) }, (args) => {
            console.log(args.path, args.importer, args.resolveDir)
            return {
              path: args.path,
              external: true,
            }
          })
        })
      },
    }
  }
}

export default webModulePlugin
