"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const agency_1 = require("../plugin-system/agency");
const customModulePlugin = {
    name: 'customModulePlugin',
    setup({ onResolve, heelHook, triggerBuild }) {
        onResolve({ filter: /\.ts$|\.tsx$|\.js$|\.jsx$/ }, (args) => {
            if (args.importer) {
                const { dir, name } = path_1.default.parse(args.absolutePath);
                const relativePath = path_1.default.relative(args.resolveDir, path_1.default.join(dir, `${name}.js`));
                const outfile = agency_1.fileToOutfile(args.absolutePath, '.js');
                heelHook(() => triggerBuild({
                    entryPoints: [args.absolutePath],
                    format: 'esm',
                    outfile: outfile,
                }));
                return {
                    external: true,
                    path: relativePath,
                };
            }
            else {
                return {
                    path: args.absolutePath,
                };
            }
        });
    },
};
exports.default = customModulePlugin;
//# sourceMappingURL=customModulePlugin.js.map