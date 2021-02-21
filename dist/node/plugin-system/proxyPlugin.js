"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const proxyPlugin = (proxyResolveMap, proxyLoadMap) => ({
    name: 'espakProxyPlugin',
    setup({ onResolve, onLoad }) {
        proxyResolveMap.forEach((val, key) => {
            onResolve(key, val);
        });
        proxyLoadMap.forEach((val, key) => {
            onLoad(key, val);
        });
    },
});
exports.default = proxyPlugin;
//# sourceMappingURL=proxyPlugin.js.map