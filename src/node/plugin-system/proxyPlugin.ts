import { ProxyPlugin } from './agency'

const proxyPlugin: ProxyPlugin = (proxyResolveAct, onLoads) => ({
  name: 'espakProxyPlugin',
  setup({ onResolve, onLoad }) {
    onResolve({ filter: /.*/ }, async (args) => {
      return await proxyResolveAct(args)
    })
    onLoad({ filter: /.*/ }, async (args) => {
      return await onLoads(args)
    })
  },
})

export default proxyPlugin
