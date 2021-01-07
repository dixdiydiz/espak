import { EspakPlugin } from '../index'
import resolve from 'resolve'
import log from 'loglevel'
import path from 'path'
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
          const to = path.join(process.cwd(), 'module/')
          const { dir } = path.parse(args.importer)
          return {
            path: path.join(path.relative(dir, to), `${ele}.js`),
            external: true,
            buildOptions: {
              sourcefile: resolve.sync(ele, {
                basedir: process.cwd(),
              }),
              outdir: 'module',
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
