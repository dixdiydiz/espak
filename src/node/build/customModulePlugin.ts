import path from 'path'
import { Format } from 'esbuild'
import { Plugin, fileToOutfile } from '../plugin-system/agency'

const customModulePlugin: Plugin = {
  name: 'customModulePlugin',
  setup({ onResolve, heelHook, triggerBuild }) {
    onResolve({ filter: /\.ts$|\.tsx$|\.js$|\.jsx$/ }, (args) => {
      const { dir, name } = path.parse(args.path)
      const relativePath = path.relative(args.resolveDir, path.join(dir, `${name}.js`))
      const outfile = fileToOutfile(args.path, '.js')
      heelHook(() =>
        triggerBuild({
          entryPoints: [args.path],
          format: 'esm' as Format,
          outfile: outfile,
          minify: false,
        })
      )
      return {
        external: true,
        path: relativePath,
      }
    })
  },
}

export default customModulePlugin
