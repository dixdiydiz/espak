"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const plainPlugin = async ({ dist, buildServe, config }, resolveModule, plugins) => {
    const alias = config?.resolve?.alias;
    const selfPlugin = {
        name: 'plainPlugin',
        setup({ onResolve, onLoad }) {
            if (alias) {
                Object.keys(alias).forEach((ele) => {
                    onResolve({ filter: new RegExp(`^${ele}`) }, (args) => {
                        const { ext, relativepath } = resolveModule(args.path, args.importer);
                        let namespace;
                        if (['.tsx', '.ts', '.jsx', '.js'].includes(ext)) {
                            namespace = '.js';
                        }
                        else {
                            namespace = ext;
                        }
                        return {
                            namespace,
                        };
                    });
                });
            }
            onResolve({ filter: /^\.\.?\// }, (args) => {
                const { ext, relativepath } = resolveModule(args.path, args.importer);
                let namespace;
                if (['.tsx', '.ts', '.jsx', '.js'].includes(ext)) {
                    namespace = '.js';
                }
                else {
                    namespace = ext;
                }
                console.log(relativepath);
                return {
                    path: relativepath,
                    namespace,
                };
            });
            onLoad({ filter: /.*/, namespace: '.js' }, (args) => {
                return {
                    // contents: `export * from ${JSON.stringify(args.path)}`,
                    contents: '',
                };
            });
        },
    };
    return selfPlugin;
};
exports.default = plainPlugin;
//# sourceMappingURL=plainPlugin.js.map