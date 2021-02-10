import resolve from 'resolve'
import log from 'loglevel'
import { Plugin } from '../plugin-system/agency'
import { isArray } from '../utils'
import { Format } from 'esbuild'
import path from 'path'

const webModulePlugin: (external: string[]) => Promise<Plugin> = async (external) => {
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
    setup({ onResolve, triggerBuild }) {
      onResolveItems.forEach((ele) => {
        onResolve({ filter: new RegExp(`^${ele}$`) }, async (args) => {
          if (/node_modules/.test(args.importer)) {
            return {
              path: args.absolutePath,
            }
          }
          const { base } = path.parse(args.absolutePath)
          const result = await triggerBuild({
            entryPoints: [args.absolutePath],
            format: 'esm' as Format,
            outfile: `module/${base}`,
            minify: false,
            define: {
              'process.env.NODE_ENV': `'"${process.env.NODE_ENV}"'` || '"production"',
            },
          })
          console.log(result)
          return {
            external: true,
          }
        })
      })
    },
  }
}

export default webModulePlugin
