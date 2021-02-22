"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const proxyPlugin = (proxyResolveAct, proxyLoadAct) => ({
    name: 'espakProxyPlugin',
    setup({ onResolve, onLoad }) {
        onResolve({ filter: /.*/ }, async (args) => {
            return await proxyResolveAct(args);
        });
        onLoad({ filter: /.*/ }, async (args) => {
            return await proxyLoadAct(args);
        });
    },
});
exports.default = proxyPlugin;
//# sourceMappingURL=proxyPlugin.js.map