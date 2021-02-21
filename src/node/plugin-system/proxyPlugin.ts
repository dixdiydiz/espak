import { ProxyPlugin } from './agency'

const proxyPlugin: ProxyPlugin = (proxyResolveMap, proxyLoadMap) => ({
  name: 'espakProxyPlugin',
  setup({ onResolve, onLoad }) {
    proxyResolveMap.forEach((val, key) => {
      onResolve(key, val)
    })
    proxyLoadMap.forEach((val, key) => {
      onLoad(key, val)
    })
  },
})

export default proxyPlugin
