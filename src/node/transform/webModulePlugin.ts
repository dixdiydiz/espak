import { EspakPlugin } from '../index'
import resolve from 'resolve'
import log from 'loglevel'
import { isArray } from '../utils'

const webModulePlugin: (external: string[]) => Promise<EspakPlugin> = async (external) => {
  const pkgPath = resolve.sync('./package.json', {
    basedir: process.cwd(),
  })
  const packageDependencies: string[] = await import(pkgPath)
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
  return {
    name: 'webModulePlugin',
    setup({ onResolve }) {
      onResolveItems.forEach((ele) => {
        onResolve({ filter: new RegExp(`^${ele}$`) }, (args) => {
          console.log('webmoduleplugin', args)
          if (/node_modules/.test(args.importer)) {
            return {
              path: args.path,
            }
          }
          return {
            external: true,
            outputOptions: {
              sourcePath: args.modulePath,
              outputDir: 'module',
              fileName: ele,
              outputExtension: '.js',
            },
            buildOptions: {
              define: {
                'process.env.NODE_ENV': `'"${process.env.NODE_ENV}"'` || '"production"',
              },
            },
          }
        })
      })
    },
  }
}

export default webModulePlugin
