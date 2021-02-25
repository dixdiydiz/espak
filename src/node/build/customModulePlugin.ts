import path from 'path'
import { Format } from 'esbuild'
import { Plugin, fileToOutfile } from '../plugin-system/agency'

const customModulePlugin: Plugin = {
  name: 'customModulePlugin',
  setup({ onResolve, heelHook, triggerBuild }) {
    onResolve({ filter: /\.ts$|\.tsx$|\.js$|\.jsx$/ }, (args) => {
      if (args.importer) {
        const { dir, name } = path.parse(args.absolutePath)
        let relativePath = path
          .relative(args.resolveDir, path.join(dir, `${name}.js`))
          .split(path.sep)
          .join(path.posix.sep)
        if (!/^[./]/.test(relativePath)) {
          relativePath = `./${relativePath}`
        }
        const outfile = fileToOutfile(args.absolutePath, '.js')
        heelHook(
          async () =>
            await triggerBuild({
              entryPoints: [args.absolutePath],
              format: 'esm' as Format,
              outfile: outfile,
            })
        )
        return {
          external: true,
          path: relativePath,
        }
      } else {
        return {
          path: args.absolutePath,
        }
      }
    })
  },
}

export default customModulePlugin
