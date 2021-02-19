"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const customModulePlugin = (alias) => {
    const match = ['./', '../', ...Object.keys(isObject(alias) ? alias : )];
    const rege = new RegExp(match.reduce((prev, curr) => {
        return `${prev}|^${curr}`;
    }, '^\\b$'));
    return {
        name: 'customModulePlugin',
        setup({ onResolve, heelHook, triggerBuild }) {
            onResolve({ filter: rege }, (args) => {
                heelHook(() => triggerBuild({
                    entryPoints: [args.absolutePath],
                    format: 'esm',
                    outfile: `module`,
                    minify: false,
                }));
                return {
                    external: true,
                };
            });
        }
    };
};
// const customModulePlugin:  = {
//   name: 'customModulePlugin',
//   setup({ onResolve }) {
//     onResolve({ filter: reg }, (args) => {
//       return {
//         external: true,
//         a: 1,
//         outputOptions: {
//           sourcePath: args.modulePath,
//           outputDir: 'src',
//           outputExtension: '.js',
//           outbase: 'src',
//         },
//       }
//     })
//   },
// }
exports.default = customModulePlugin;
//# sourceMappingURL=customModulePlugin.js.map