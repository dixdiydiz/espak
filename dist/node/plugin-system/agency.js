"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.entryHandler = exports.constructEsbuildPlugin = exports.connectConfigHelper = void 0;
const resolve_1 = __importDefault(require("resolve"));
const loglevel_1 = __importDefault(require("loglevel"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const esbuild_1 = require("esbuild");
const index_1 = require("../index");
// import { MapModule } from './mapping'
const utils_1 = require("../utils");
function connectConfigHelper(callback, args) {
    const wrapPlugin = async (config) => {
        const valOfConfig = args.map((keys) => {
            return keys.split('.').reduce((prev, curr) => (prev ? prev[curr] : prev), config);
        });
        return await callback(...valOfConfig);
    };
    wrapPlugin._needConfig = true;
    return wrapPlugin;
}
exports.connectConfigHelper = connectConfigHelper;
async function decomposePlugin(pendingPlugins, config) {
    const distDir = await index_1.createTempDist();
    const onResolveMap = new Map();
    const onLoadMap = new Map();
    const heelHookSet = new Set();
    const triggerBuildPlugins = new Set();
    for (let cb of pendingPlugins) {
        const { name = '', setup } = '_needConfig' in cb ? await cb(config) : cb;
        try {
            setup({
                onResolve: onResolve(name),
                onLoad: onLoad(name),
                heelHook,
                triggerBuild: triggerBuild(name),
            });
        }
        catch (e) {
            loglevel_1.default.error(`plugin ${name} error: ${e}`);
            process.exit(1);
        }
    }
    return {
        onResolveMap,
        onLoadMap,
        heelHookSet,
        triggerBuildPlugins,
    };
    function onResolve(name) {
        return (options, callback) => {
            callback._pluginName = name;
            onResolveMap.set(options, callback);
        };
    }
    function onLoad(name) {
        return (options, callback) => {
            callback._pluginName = name;
            onLoadMap.set(options, callback);
        };
    }
    function heelHook(cb) {
        heelHookSet.add(cb);
    }
    function triggerBuild(name) {
        /**
         * only support build one file, don't use outdir.
         * */
        return async (options, rewrite = false) => {
            if (!utils_1.isArray(options)) {
                options = [options];
            }
            try {
                for (let opt of options) {
                    const { entryPoints, outfile, plugins = [] } = opt;
                    if (utils_1.isArray(entryPoints)) {
                        if (entryPoints.length > 1) {
                            loglevel_1.default.warn('triggerBuild only support build one file once. other files will be ignored.');
                        }
                        opt.entryPoints = entryPoints.slice(0, 1);
                    }
                    Reflect.deleteProperty(opt, 'outdir');
                    if (outfile) {
                        opt.outfile = path_1.default.join(distDir, outfile);
                        opt.plugins = [...plugins, ...triggerBuildPlugins];
                    }
                }
                const metafile = path_1.default.join(distDir, 'meta.json');
                const meta = await narrowBuild(name, options, metafile);
                console.log(meta);
                return meta;
            }
            catch (e) {
                loglevel_1.default.error(`triggerBuild callback get some error in ${name} plugin`);
                loglevel_1.default.error(e);
                process.exit(1);
            }
        };
    }
}
async function proxyResolveAct(aliasReplacer, extensions, onResolveMap, heelHookSet, args) {
    const { path, namespace, resolveDir, pluginData } = args;
    const aliasPath = aliasReplacer(path);
    const absolutePath = resolve_1.default.sync(aliasPath, {
        basedir: resolveDir,
        extensions,
    });
    let result;
    for (let [{ filter, namespace: pluginNamespace }, callback] of onResolveMap) {
        if ((pluginNamespace && namespace !== pluginNamespace) || !filter.test(absolutePath)) {
            continue;
        }
        heelHookSet.clear();
        result = await callback({
            ...args,
            absolutePath,
        });
        if (utils_1.isObject(result)) {
            result.pluginName = callback._pluginName;
            // If path not set, esbuild will continue to run on-resolve callbacks that were registered after the current one.
            if (result.path) {
                for (let hook of heelHookSet) {
                    await hook(pluginData);
                }
                return result;
            }
        }
        // else continue
    }
    return result;
}
async function proxyLoadAct(onLoadMap, heelHookSet, args) {
    const { path, pluginData, namespace } = args;
    let result;
    for (let [{ filter, namespace: pluginNamespace }, callback] of onLoadMap) {
        if ((pluginNamespace && namespace !== pluginNamespace) || !filter.test(path)) {
            continue;
        }
        heelHookSet.clear();
        result = await callback({ ...args });
        if (utils_1.isObject(result)) {
            // If this is not set, esbuild will continue to run on-load callbacks that were registered after the current one
            if (result.contents) {
                for (let hook of heelHookSet) {
                    await hook(pluginData);
                }
                return result;
            }
        }
        // else continue
    }
    return result;
}
async function constructEsbuildPlugin(proxyPlugin, plugins, config) {
    const { resolve: { alias, extensions }, } = config;
    const replacer = aliasReplacer(alias);
    const { onResolveMap, onLoadMap, heelHookSet, triggerBuildPlugins } = await decomposePlugin(plugins, config);
    const esbuildPlugin = await proxyPlugin(proxyResolveAct.bind(null, replacer, extensions, onResolveMap, heelHookSet), proxyLoadAct.bind(null, onLoadMap, heelHookSet));
    triggerBuildPlugins.add(esbuildPlugin);
    return esbuildPlugin;
}
exports.constructEsbuildPlugin = constructEsbuildPlugin;
function aliasReplacer(alias) {
    if (utils_1.isObject(alias)) {
        const rege = new RegExp(Object.keys(alias).reduce((prev, curr) => {
            return `${prev}|^${curr}`;
        }, '^\\b$'));
        return (path) => path.replace(rege, (match) => alias[match]);
    }
    return (path) => path;
}
async function narrowBuild(mark, options, metafile, rewrite = false) {
    let metadata = { inputs: {}, outputs: {} };
    try {
        // options = options
        //   .filter((opt) => {
        //     if (opt.entryPoints?.length) {
        //       const input = opt.entryPoints![0]
        //       const mod = MapModule._cache[input]
        //       if (mod) {
        //         result[input] = mod.outfile
        //         return false
        //       }
        //       const mod = new MapModule(input)
        //       mod.addCache()
        //       mod.outfile = opt.outfile || ''
        //       result[input] = mod.outfile
        //       return true
        //     }
        //     return false
        //   })
        //   .map((opt) => ({
        //     ...opt,
        //     metafile,
        //   }))
        options = options.map((opt) => ({
            ...opt,
            metafile,
        }));
        const service = await esbuild_1.startService();
        const promises = [];
        for (let opt of options) {
            promises.push(service.build(opt).then((res) => {
                const data = JSON.parse(fs_extra_1.default.readFileSync(metafile, 'utf-8'));
                const { inputs, outputs } = metadata;
                metadata = {
                    inputs: {
                        ...inputs,
                        ...data.inputs,
                    },
                    outputs: {
                        ...outputs,
                        ...data.outputs,
                    },
                };
            }));
        }
        await Promise.all(promises);
        return metadata;
    }
    catch (e) {
        loglevel_1.default.error(`build error in ${mark}:`);
        loglevel_1.default.error(e);
        process.exit(1);
    }
}
async function entryHandler(srcs, plugins) {
    const distDir = await index_1.createTempDist();
    const options = srcs.map((src) => {
        const { name } = path_1.default.parse(src);
        const outfile = path_1.default.resolve(distDir, 'src', `${name}.js`);
        return {
            entryPoints: [src],
            bundle: true,
            minify: true,
            format: 'esm',
            outfile,
            plugins,
        };
    });
    const metafile = path_1.default.join(distDir, 'meta.json');
    await narrowBuild('entry file', options, metafile);
}
exports.entryHandler = entryHandler;
//# sourceMappingURL=agency.js.map