"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
const plainEsbuildPlugin = async ({ namespaces }, onResolves, onLoads) => {
    const selfPlugin = {
        name: 'plainPlugin',
        setup({ onResolve, onLoad }) {
            onResolve({ filter: /.*/ }, async (args) => {
                return await onResolves({
                    ...args,
                });
            });
            onLoad({ filter: /.*/ }, async (args) => {
                return await onLoads({
                    ...args,
                });
            });
            if (utils_1.isArray(namespaces)) {
                namespaces.forEach((ns) => {
                    onResolve({ filter: /.*/, namespace: ns }, async (args) => {
                        return await onResolves({
                            ...args,
                        });
                    });
                    onLoad({ filter: /.*/, namespace: ns }, async (args) => {
                        return await onLoads({
                            ...args,
                        });
                    });
                });
            }
        },
    };
    return selfPlugin;
};
exports.default = plainEsbuildPlugin;
//# sourceMappingURL=plainEsbuildPlugin.js.map