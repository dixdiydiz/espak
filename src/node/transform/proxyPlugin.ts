import { Plugin } from 'esbuild'
import { ProxyPlugin } from './fabrication'
import { isArray } from '../utils'

const proxyPlugin: ProxyPlugin = async ({ namespaces }, onResolves, onLoads) => {
  const self = {
    name: 'plainPlugin',
    setup({ onResolve, onLoad }) {
      onResolve({ filter: /.*/ }, async (args) => {
        return await onResolves(
          {
            ...args,
          },
          self
        )
      })
      onLoad({ filter: /.*/ }, async (args) => {
        return await onLoads(
          {
            ...args,
          },
          self
        )
      })
      if (isArray(namespaces)) {
        namespaces.forEach((ns) => {
          onResolve({ filter: /.*/, namespace: ns }, async (args) => {
            return await onResolves(
              {
                ...args,
              },
              self
            )
          })
          onLoad({ filter: /.*/, namespace: ns }, async (args) => {
            return await onLoads(
              {
                ...args,
              },
              self
            )
          })
        })
      }
    },
  } as Plugin
  return self
}

export default proxyPlugin
