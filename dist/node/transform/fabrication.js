"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.customModuleHandler = exports.createPlugin = exports.resolveModule = void 0;
const resolve_1 = __importDefault(require("resolve"));
const loglevel_1 = __importDefault(require("loglevel"));
const wrapEsbuild_1 = require("./wrapEsbuild");
const index_1 = require("../index");
const utils_1 = require("../utils");
function resolveModule(extensions, alias, to, from) {
    if (alias && utils_1.isObject(alias) && !/^(\.\/|\.\.\/)/.test(to)) {
        for (let [key, val] of Object.entries(alias)) {
            const reg = new RegExp(`^${key}`);
            if (reg.test(to)) {
                to = to.replace(reg, val);
                break;
            }
        }
    }
    const { dir: fromdir } = path.parse(from);
    const file = resolve_1.default.sync(to, {
        basedir: fromdir,
        extensions,
    });
    const { root, dir, base, ext, name } = path.parse(file);
    let relativedir = path.relative(dir, fromdir);
    if (!relativedir) {
        relativedir = './';
    }
    const relativepath = path.resolve(relativedir, base);
    return {
        resolvepath: to,
        root,
        dir,
        base,
        ext,
        name,
        relativedir,
        relativepath,
    };
}
exports.resolveModule = resolveModule;
async function createPlugin(simplePlugin, plugins, config) {
    const dist = await index_1.createTempDist();
    const { resolve: { extensions, alias }, } = config;
    const resolveModuleFn = resolveModule.bind(null, extensions, alias);
    const { namespaces, resolveMap, loadMap } = mobilizePlugin(plugins);
    return simplePlugin({ namespaces });
}
exports.createPlugin = createPlugin;
function mobilizePlugin(plugins) {
    const resolveMap = new Map();
    const loadMap = new Map();
    const namespaces = [];
    plugins.forEach((ele) => {
        try {
            const { namespace, setup } = ele;
            if (namespace) {
                namespaces.push(namespace);
            }
            setup({
                onResolve,
                onLoad,
            });
        }
        catch (e) {
            loglevel_1.default.error(e);
        }
    });
    return {
        resolveMap,
        loadMap,
        namespaces,
    };
    function onResolve(options, callback) {
        resolveMap.set(options, callback);
    }
    function onLoad(options, callback) {
        loadMap.set(options, callback);
    }
}
const { path, importer, resolveDir, namespace } = args;
// async function exceptionHandle(fn: Function, ...args: any[]): Promise<Plugin | null> {
//   try {
//     return await fn(...args)
//   } catch (e) {
//     log.error(e)
//     return null
//   }
// }
async function customModuleHandler(src, option) {
    const builder = [
        {
            entryPoints: src,
            bundle: true,
            minify: true,
            format: 'esm',
            ...option,
        },
    ];
    await wrapEsbuild_1.startBuildServe(builder);
}
exports.customModuleHandler = customModuleHandler;
//# sourceMappingURL=fabrication.js.map