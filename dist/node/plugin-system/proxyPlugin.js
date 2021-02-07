"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const proxyPlugin = (onResolves, onLoads) => ({
    name: 'espakProxyPlugin',
    setup({ onResolve, onLoad }) {
        onResolve({ filter: /.*/ }, async (args) => {
            return await onResolves(args);
        });
        onLoad({ filter: /.*/ }, async (args) => {
            return await onLoads(args);
        });
    },
});
exports.default = proxyPlugin;
//# sourceMappingURL=proxyPlugin.js.map