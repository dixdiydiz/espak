import resolve from 'resolve'
import log from 'loglevel'
import { Plugin } from '../plugin-system/agency'
import { isArray } from '../utils'
import { Format } from 'esbuild'
import path from 'path'

const webModulePlugin: (external: string[], cjsModule?: Record<string, string>) => Promise<Plugin> = async (
  external,
  cjsModule
) => {
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
    setup({ onResolve, onLoad, triggerBuild }) {
      const namespace = 'cjsModule'
      const rege: RegExp = new RegExp(
        onResolveItems.reduce((prev, curr) => {
          return `^${prev}$|^${curr}$`
        }, '^\\b$')
      )
      onResolve({ filter: rege }, async (args) => {
        if (args.importer) {
          if (/node_modules/.test(args.importer)) {
            return {
              path: args.path,
            }
          }
          console.log('web', cache)
          if (cache[args.path]) {
            const { dir } = path.parse(args.importerOutfile)
            const outfile = cache[args.path].outfile
            console.log('has cache', dir, outfile)
            return {
              external: true,
              path: path.relative(dir, outfile),
            }
          }
          const result = await triggerBuild({
            entryPoints: [args.path],
            format: 'esm' as Format,
            outfile: `module/${args.path}.js`,
            define: {
              'process.env.NODE_ENV': `'"${process.env.NODE_ENV}"'` || '"production"',
            },
          })
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
        } else if (cjsModule) {
          return {
            path: args.path,
            namespace,
          }
        }
        return {
          path: args.absolutePath,
        }
      })
      // onResolveItems.forEach((ele) => {
      //   onResolve({ filter: new RegExp(`^${ele}$`) }, async (args) => {
      //     console.log('web', args)
      //     if (args.importer) {
      //       if (/node_modules/.test(args.importer)) {
      //         return {
      //           path: args.path,
      //         }
      //       }
      //       if (cache[args.path]) {
      //         const { dir } = path.parse(args.importerOutfile)
      //         const outfile = cache[args.path].outfile
      //         console.log('has cache', dir, outfile)
      //         return {
      //           external: true,
      //           path: path.relative(dir, outfile),
      //         }
      //       }
      //       const result = await triggerBuild({
      //         entryPoints: [args.path],
      //         format: 'esm' as Format,
      //         outfile: `module/${ele}.js`,
      //         define: {
      //           'process.env.NODE_ENV': `'"${process.env.NODE_ENV}"'` || '"production"',
      //         },
      //       })
      //       const { dir } = path.parse(args.importerOutfile)
      //       const outfile = result[args.path].outfile
      //       cache = {
      //         ...cache,
      //         ...result,
      //       }
      //       console.log('no cache', dir, outfile)
      //       return {
      //         external: true,
      //         path: path.relative(dir, outfile),
      //       }
      //     } else if (cjsModule) {
      //       return {
      //         path: args.path,
      //         namespace,
      //       }
      //     }
      //     return {
      //       path: args.absolutePath,
      //     }
      //   })
      // })
      onLoad({ filter: /.*/, namespace }, (args) => {
        return {
          contents: cjsModule![args.path],
        }
      })
    },
  }
}

export default webModulePlugin
