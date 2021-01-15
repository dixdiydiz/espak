import { EspakPlugin } from '../index'
const customModulePlugin: EspakPlugin = {
  name: 'customModulePlugin',
  setup({ onResolve }) {
    // only support $cwd/src path
    const path = require('path')
    const srcpath = path.resolve(process.cwd(), 'src')
    const reg = new RegExp(`^${srcpath}.*(\\.tsx$|\\.ts$|\\.jsx$|\\.js$)`)
    onResolve({ filter: reg }, (args) => {
      return {
        external: true,
        outputOptions: {
          sourcePath: args.modulePath,
          outputDir: 'src',
          outputExtension: '.js',
          outbase: 'src',
        },
      }
    })
  },
}

export default customModulePlugin
