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
  let cache = Object.create(null)
  return {
    name: 'webModulePlugin',
    setup({ onResolve, triggerBuild }) {
      onResolveItems.forEach((ele) => {
        onResolve({ filter: new RegExp(`^${ele}$`) }, async (args) => {
          if (/node_modules/.test(args.importer)) {
            return {
              path: args.path,
            }
          }
          if (cache[args.path]) {
            const { dir } = path.parse(args.importerOutfile)
            const outfile = cache[args.path].outfile
            return {
              external: true,
              path: path.relative(dir, outfile),
            }
          }
          const result = await triggerBuild({
            entryPoints: [args.path],
            format: 'esm' as Format,
            outfile: `module/${ele}.js`,
            minify: false,
            define: {
              'process.env.NODE_ENV': `'"${process.env.NODE_ENV}"'` || '"production"',
            },
          })
          console.log(result)
          const { dir } = path.parse(args.importerOutfile)
          const outfile = result[args.path].outfile
          cache = {
            ...cache,
            ...result,
          }
          return {
            external: true,
            path: path.relative(dir, outfile),
          }
        })
      })
    },
  }
}

export default webModulePlugin
