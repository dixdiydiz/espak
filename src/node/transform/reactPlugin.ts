import type { Plugin, PluginBuild } from 'esbuild'
import path from 'path'
export const reactPlugin: Plugin = {
  name: 'reactPlugin',
  setup(build: PluginBuild) {
    // const path = require('path')
    build.onResolve({ filter: /^react$/ }, (args) => {
      console.log('onresolve----', args)
      return { path: path.join(args.resolveDir, 'aa', args.path) }
    })
    build.onLoad({ filter: /react$/ }, async (args) => {
      await new Promise((r) => {
        console.log(args)
        r(true)
      })
      return {}
    })
  },
}
export default reactPlugin
