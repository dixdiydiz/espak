import { EspakPlugin } from '../index'
import { resolveModule } from './fabrication'
import log from 'loglevel'
import path from 'path'
import { isArray } from '../utils'

const webModulePlugin: (external: string[]) => Promise<EspakPlugin> = async (external) => {
  const pkgPath = resolveModule('./package.json', {
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
  const mapPaths = Object.create(null)
  onResolveItems.forEach((ele) => {
    mapPaths[ele] = resolveModule(ele, {
      basedir: process.cwd(),
    })
  })
  return async ({ dist, buildServe }) => {
    const buildOptions = Object.entries(mapPaths).map(([key, val]) => ({
      entryPoints: [val] as string[],
      outfile: path.join(dist.tempModule, `${key}.js`),
      bundle: true,
      minify: true,
      format: 'esm' as const,
      define: {
        'process.env.NODE_ENV': `'"${process.env.NODE_ENV}"'` || '"production"',
      },
    }))
    await buildServe(buildOptions)
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
            }
          })
        })
        if (isArray(external)) {
          external.forEach((ele) => {
            onResolve({ filter: new RegExp(`^${ele}$`) }, (args) => {
              return {
                namespace: ele,
              }
            })
          })
        }
      },
    }
  }
}

export default webModulePlugin
