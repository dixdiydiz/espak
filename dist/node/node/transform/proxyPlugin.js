"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
const proxyPlugin = async ({ namespaces }, onResolves, onLoads) => {
    const self = {
        name: 'espakProxyPlugin',
        setup({ onResolve, onLoad }) {
            onResolve({ filter: /.*/ }, async (args) => {
                return await onResolves({
                    ...args,
                }, self);
            });
            onLoad({ filter: /.*/ }, async (args) => {
                return await onLoads({
                    ...args,
                }, self // not use yet
                );
            });
            if (utils_1.isArray(namespaces)) {
                namespaces.forEach((ns) => {
                    onResolve({ filter: /.*/, namespace: ns }, async (args) => {
                        return await onResolves({
                            ...args,
                        }, self);
                    });
                    onLoad({ filter: /.*/, namespace: ns }, async (args) => {
                        return await onLoads({
                            ...args,
                        }, self // not use yet
                        );
                    });
                });
            }
        },
    };
    return self;
};
exports.default = proxyPlugin;
//# sourceMappingURL=proxyPlugin.js.map