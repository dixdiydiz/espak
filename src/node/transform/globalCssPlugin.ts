import type { Plugin, PluginBuild } from 'esbuild'
import path from 'path'
export const globalCssPlugin: Plugin = {
  name: 'globalCssPlugin',
  setup(build: PluginBuild) {
    build.onResolve({ filter: /.css/ }, (args) => {
      // console.log(args)
      return { path: path.join(args.resolveDir, 'aa', args.path) }
    })
    build.onLoad({ filter: /.*/ }, (args) => {
      // console.log(args)
      return {}
    })
  },
}
export default globalCssPlugin
