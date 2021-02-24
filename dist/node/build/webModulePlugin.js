"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const resolve_1 = __importDefault(require("resolve"));
const loglevel_1 = __importDefault(require("loglevel"));
const utils_1 = require("../utils");
const path_1 = __importDefault(require("path"));
const webModulePlugin = async (external, cjsModule) => {
    const pkgPath = resolve_1.default.sync('./package.json', {
        basedir: process.cwd(),
    });
    const packageDependencies = await Promise.resolve().then(() => __importStar(require(pkgPath))).then((r) => {
        const { dependencies = {} } = r;
        return Object.keys(dependencies);
    })
        .catch((e) => {
        loglevel_1.default.error(e);
        return [];
    });
    const onResolveItems = utils_1.isArray(external)
        ? packageDependencies.filter((ele) => !external.includes(ele))
        : packageDependencies;
    let cache = Object.create(null);
    return {
        name: 'webModulePlugin',
        setup({ onResolve, onLoad, triggerBuild }) {
            const namespace = 'cjsModule';
            const rege = new RegExp(onResolveItems.reduce((prev, curr) => {
                return `^${prev}$|^${curr}$`;
            }, '^\\b$'));
            onResolve({ filter: rege }, async (args) => {
                if (args.importer) {
                    if (/node_modules/.test(args.importer)) {
                        return {
                            path: args.path,
                        };
                    }
                    console.log('web', cache);
                    if (cache[args.path]) {
                        const { dir } = path_1.default.parse(args.importerOutfile);
                        const outfile = cache[args.path].outfile;
                        console.log('has cache', dir, outfile);
                        return {
                            external: true,
                            path: path_1.default.relative(dir, outfile),
                        };
                    }
                    const result = await triggerBuild({
                        entryPoints: [args.path],
                        format: 'esm',
                        outfile: `module/${args.path}.js`,
                        define: {
                            'process.env.NODE_ENV': `'"${process.env.NODE_ENV}"'` || '"production"',
                        },
                    });
                    const { dir } = path_1.default.parse(args.importerOutfile);
                    const outfile = result[args.path].outfile;
                    cache = {
                        ...cache,
                        ...result,
                    };
                    return {
                        external: true,
                        path: path_1.default.relative(dir, outfile),
                    };
                }
                else if (cjsModule) {
                    return {
                        path: args.path,
                        namespace,
                    };
                }
                return {
                    path: args.absolutePath,
                };
            });
            // onResolveItems.forEach((ele) => {
            //   onResolve({ filter: new RegExp(`^${ele}$`) }, async (args) => {
            //     console.log('web', args)
            //     if (args.importer) {
            //       if (/node_modules/.test(args.importer)) {
            //         return {
            //           path: args.path,
            //         }
            //       }
            //       if (cache[args.path]) {
            //         const { dir } = path.parse(args.importerOutfile)
            //         const outfile = cache[args.path].outfile
            //         console.log('has cache', dir, outfile)
            //         return {
            //           external: true,
            //           path: path.relative(dir, outfile),
            //         }
            //       }
            //       const result = await triggerBuild({
            //         entryPoints: [args.path],
            //         format: 'esm' as Format,
            //         outfile: `module/${ele}.js`,
            //         define: {
            //           'process.env.NODE_ENV': `'"${process.env.NODE_ENV}"'` || '"production"',
            //         },
            //       })
            //       const { dir } = path.parse(args.importerOutfile)
            //       const outfile = result[args.path].outfile
            //       cache = {
            //         ...cache,
            //         ...result,
            //       }
            //       console.log('no cache', dir, outfile)
            //       return {
            //         external: true,
            //         path: path.relative(dir, outfile),
            //       }
            //     } else if (cjsModule) {
            //       return {
            //         path: args.path,
            //         namespace,
            //       }
            //     }
            //     return {
            //       path: args.absolutePath,
            //     }
            //   })
            // })
            onLoad({ filter: /.*/, namespace }, (args) => {
                return {
                    contents: cjsModule[args.path],
                };
            });
        },
    };
};
exports.default = webModulePlugin;
//# sourceMappingURL=webModulePlugin.js.map