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
const utils_1 = require("../../utils");
function resolveModule(extensions, alias, to, fromdir) {
    if (alias && utils_1.isObject(alias) && !/^(\.\/|\.\.\/)/.test(to)) {
        for (let [key, val] of Object.entries(alias)) {
            const reg = new RegExp(`^${key}`);
            if (reg.test(to)) {
                to = to.replace(reg, val);
                break;
            }
        }
    }
    const modulePath = resolve_1.default.sync(to, {
        basedir: fromdir,
        extensions,
    });
    const { name } = path_1.default.parse(modulePath);
    return {
        modulePath,
        name,
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
            const { name = '', setup, namespace } = ele;
            if (namespace) {
                namespaces.push(namespace);
            }
            setup({
                onResolve: onResolve(name),
                onLoad: onLoad(name),
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
    function onResolve(name) {
        return (options, callback) => {
            const onResolveCallback = (args) => callback(args);
            onResolveCallback.pluginName = name;
            resolveMap.set(options, onResolveCallback);
        };
    }
    function onLoad(name) {
        return (options, callback) => {
            const onLoadCallback = (args) => callback(args);
            onLoadCallback.pluginName = name;
            loadMap.set(options, onLoadCallback);
        };
    }
}
async function onResolves(resolveFn, resolveMap, args, esbuildPlugin) {
    const { path: rawModulePath, importer, resolveDir, namespace: importerNamespace } = args;
    const dist = await index_1.createTempDist();
    // namespace default set to "file"
    for (let [{ filter, namespace = 'file' }, callback] of resolveMap) {
        const { modulePath, name } = resolveFn(rawModulePath, resolveDir);
        // match import path or absolute path
        if ([rawModulePath, modulePath].some((ele) => filter.test(ele)) && namespace === importerNamespace) {
            const rawResolveResult = await callback({
                ...args,
                modulePath,
            });
            const { resolveResult: ripeResolveResult, outputOptions, buildOptions } = verifyOnResolveResult(callback.pluginName, rawResolveResult);
            let relative = '';
            if (outputOptions) {
                const { sourcePath, fileName = '', key = '', outputDir = '', outputExtension = '.js' } = outputOptions;
                const entry = sourcePath || modulePath;
                if (infileToOutfile[entry]) {
                    relative = convertRelativePath(infileToOutfile[importer], infileToOutfile[entry]);
                }
                else {
                    const outfile = path_1.default.resolve(dist, outputDir, `${fileName || name}${key ? `-${key}` : ''}${outputExtension}`);
                    try {
                        infileToOutfile[entry] = outfile;
                        await wrapEsbuild_1.startBuildServe([
                            {
                                minify: true,
                                format: 'esm',
                                ...buildOptions,
                                entryPoints: [entry],
                                bundle: true,
                                outfile,
                                plugins: [esbuildPlugin],
                            },
                        ]);
                        relative = convertRelativePath(infileToOutfile[importer], infileToOutfile[entry]);
                    }
                    catch (e) {
                        loglevel_1.default.error(e);
                        process.exit(1);
                    }
                }
            }
            return {
                ...ripeResolveResult,
                path: ripeResolveResult?.path || relative,
            };
        }
    }
    return null;
    function convertRelativePath(importer, modulePath) {
        const { dir } = path_1.default.parse(importer);
        const relative = path_1.default.relative(dir, modulePath);
        // if (!/\//.test(relative)) {
        //   return `./${relative}`
        // }
        return relative;
    }
}
async function onLoads(resolveFn, loadMap, args, esbuildPlugin // not use yet
) {
    const { path: absoluteModulePath, namespace: moduleNamespace } = args;
    for (let [{ filter, namespace }, callback] of loadMap) {
        if (filter.test(absoluteModulePath) && namespace === moduleNamespace) {
            const rawLoadResult = await callback({
                ...args,
            });
            return {
                ...rawLoadResult,
            };
        }
    }
    return null;
}
function verifyOnResolveResult(pluginName, resolveResult) {
    const support = ['path', 'external', 'namespace', 'errors', 'warnings', 'pluginName'];
    const extraOptions = {
        outputOptions: undefined,
        buildOptions: undefined,
    };
    let result = resolveResult;
    if (utils_1.isObject(resolveResult)) {
        result = Object.create(null);
        const extraOptionsKeys = Object.keys(extraOptions);
        for (let [key, val] of Object.entries(resolveResult)) {
            if (support.includes(key)) {
                result[key] = val;
            }
            else if (extraOptionsKeys.includes(key)) {
                extraOptions[key] = val;
            }
            else {
                loglevel_1.default.error(`[plugin error]: Invalid option from onResolve() callback in plugin ${pluginName || 'unknown plugin'}: ${key}`);
                process.exit(1);
            }
        }
    }
    return {
        resolveResult: result,
        outputOptions: extraOptions.outputOptions,
        buildOptions: extraOptions.buildOptions,
    };
}
const infileToOutfile = Object.create(null);
async function entryHandler(src, option) {
    const { dist, plugins } = option;
    const builder = src.map((entry) => {
        const { name } = path_1.default.parse(entry);
        const outfile = path_1.default.resolve(dist, 'src', `${name}.js`);
        infileToOutfile[entry] = outfile;
        return {
            entryPoints: [entry],
            bundle: true,
            minify: true,
            format: 'esm',
            outfile,
            plugins,
        };
    });
    await wrapEsbuild_1.startBuildServe(builder);
}
exports.entryHandler = entryHandler;
//# sourceMappingURL=fabrication.js.map