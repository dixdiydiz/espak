import { Plugin } from 'esbuild'
import { SimplePlugin } from './fabrication'
import { isArray } from '../utils'

const plainPlugin: SimplePlugin = async ({ namespaces }, onResolves, onLoads) => {
  const selfPlugin = {
    name: 'plainPlugin',
    setup({ onResolve, onLoad }) {
      onResolve({ filter: /.*/ }, async (args) => {
        return await onResolves({
          ...args,
        })
      })
      onLoad({ filter: /.*/ }, async (args) => {
        return await onLoads({
          ...args,
        })
      })
      if (isArray(namespaces)) {
        namespaces.forEach((ns) => {
          onResolve({ filter: /.*/, namespace: ns }, async (args) => {
            return await onResolves({
              ...args,
            })
          })
          onLoad({ filter: /.*/, namespace: ns }, async (args) => {
            return await onLoads({
              ...args,
            })
          })
        })
      }
    },
  } as Plugin
  return selfPlugin
}

export default plainPlugin
