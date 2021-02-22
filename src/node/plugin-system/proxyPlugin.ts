import { ProxyPlugin } from './agency'

const proxyPlugin: ProxyPlugin = (proxyResolveAct, proxyLoadAct) => ({
  name: 'espakProxyPlugin',
  setup({ onResolve, onLoad }) {
    onResolve({ filter: /.*/ }, async (args) => {
      return await proxyResolveAct(args)
    })
    onLoad({ filter: /.*/ }, async (args) => {
      return await proxyLoadAct(args)
    })
  },
})
export default proxyPlugin
