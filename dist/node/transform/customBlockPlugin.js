"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const resolve_1 = __importDefault(require("resolve"));
const path_1 = __importDefault(require("path"));
const utils_1 = require("../utils");
const plainPlugin = async ({ dist, buildServe, config }, plugins) => {
    const { extensions, alias } = config.resolve;
    const selfPlugin = {
        name: 'plainPlugin',
        setup({ onResolve }) {
            if (alias && utils_1.isObject(alias)) {
                Object.entries(alias).forEach(([key, val]) => {
                    onResolve({ filter: new RegExp(`^${key}`) }, (args) => {
                        let absolutePath = resolve_1.default.sync(args.path.replace(key, val), {
                            basedir: process.cwd(),
                            extensions,
                        });
                        const { dir, base } = path_1.default.parse(absolutePath);
                        const relative = path_1.default.relative(args.resolveDir, dir);
                        let relativePath;
                        if (relative) {
                            relativePath = path_1.default.join(relative, base);
                        }
                        else {
                            relativePath = `./${base}`;
                        }
                        return {
                            path: relativePath,
                        };
                    });
                });
            }
            onResolve({ filter: /(^\.\/.*)|(^\.\.\/)/ }, (args) => {
                console.log(args.path);
                return {
                    path: args.path,
                    external: true,
                };
            });
        },
    };
    return selfPlugin;
};
exports.default = plainPlugin;
//# sourceMappingURL=customBlockPlugin.js.map