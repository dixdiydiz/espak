"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.entryHandler = exports.createPlugin = exports.resolveModule = void 0;
const resolve_1 = __importDefault(require("resolve"));
const loglevel_1 = __importDefault(require("loglevel"));
const path_1 = __importDefault(require("path"));
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
    const { dir: fromdir } = path_1.default.parse(from);
    const file = resolve_1.default.sync(to, {
        basedir: fromdir,
        extensions,
    });
    const { root, dir, base, ext, name } = path_1.default.parse(file);
    let relativedir = path_1.default.relative(dir, fromdir);
    if (!relativedir) {
        relativedir = './';
    }
    const relativepath = path_1.default.resolve(relativedir, base);
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
async function createPlugin(proxyPlugin, plugins, config) {
    const { resolve: { extensions, alias }, } = config;
    const resolveModuleFn = resolveModule.bind(null, extensions, alias);
    const { namespaces, resolveMap, loadMap } = mobilizePlugin(plugins);
    return proxyPlugin({ namespaces }, onResolves.bind(null, resolveModuleFn, resolveMap), onLoads.bind(null, resolveModuleFn, loadMap));
}
exports.createPlugin = createPlugin;
function mobilizePlugin(plugins) {
    const resolveMap = new Map();
    const loadMap = new Map();
    const namespaces = [];
    plugins.forEach((ele) => {
        try {
            const { setup, namespace } = ele;
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
async function onResolves(resolveFn, resolveMap, args, esbuildPlugin) {
    const { path, importer, resolveDir, namespace: importerNamespace } = args;
    const dist = await index_1.createTempDist();
    if (importer) {
        for (let [key, cb] of resolveMap) {
            const { filter, namespace } = key;
            if (filter.test(path) && namespace === importerNamespace) {
                const resolveResult = await cb({ ...args });
                if (resolveResult?.buildOptions) {
                }
            }
        }
    }
    else {
        return null;
    }
}
async function onLoads(resolveFn, loadMap, args, esbuildPlugin) {
    const { path, namespace: argsNamespace } = args;
    const dist = await index_1.createTempDist();
    // for (let [key, value] of resolveMap) {
    //   const { filter, namespace } = key
    // }
    return null;
}
async function entryHandler(src, option) {
    const { dist, plugins } = option;
    const builder = src.map((entry) => {
        const { name } = path_1.default.parse(entry);
        return {
            entryPoints: [entry],
            bundle: true,
            minify: true,
            format: 'esm',
            outfile: path_1.default.resolve(dist.tempSrc, name, '.js'),
            plugins,
        };
    });
    await wrapEsbuild_1.startBuildServe(builder);
}
exports.entryHandler = entryHandler;
//# sourceMappingURL=fabrication.js.map