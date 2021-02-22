"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileToOutfile = exports.entryHandler = exports.constructEsbuildPlugin = exports.connectConfigHelper = void 0;
const resolve_1 = __importDefault(require("resolve"));
const loglevel_1 = __importDefault(require("loglevel"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const esbuild_1 = require("esbuild");
const index_1 = require("../index");
const mapping_1 = require("./mapping");
const extendPlugin_1 = require("./extendPlugin");
const utils_1 = require("../utils");
function connectConfigHelper(callback, args) {
    const wrapPlugin = async (config) => {
        const valOfConfig = args.map((keys) => {
            return keys.split('.').reduce((prev, curr) => (prev ? prev[curr] : prev), config);
        });
        return callback(...valOfConfig);
    };
    wrapPlugin._needConfig = true;
    return wrapPlugin;
}
exports.connectConfigHelper = connectConfigHelper;
async function decomposePlugin(pendingPlugins, config) {
    const onResolveMap = new Map();
    const onLoadMap = new Map();
    const heelHookSet = new Set();
    const triggerBuildPlugins = new Set();
    for (let cb of pendingPlugins) {
        const { name = '', setup, generateIndexHtml } = '_needConfig' in cb ? await cb(config) : cb;
        try {
            if (setup) {
                setup({
                    onResolve: onResolve(name),
                    onLoad: onLoad(name),
                    heelHook,
                    triggerBuild: triggerBuild(name),
                });
            }
            if (utils_1.isFunction(generateIndexHtml)) {
                generateIndexHtml._pluginName = name;
                extendPlugin_1.generateIndexHtmlHook(generateIndexHtml);
            }
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
        return async (options, overwrite = false) => {
            options = utils_1.isArray(options) ? options : [options];
            options.forEach((opt) => {
                const { plugins = [] } = opt;
                opt.plugins = [...plugins, ...triggerBuildPlugins];
            });
            return narrowBuild(`plugin ${name}`, options, overwrite);
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
    let result = {};
    for (let [{ filter, namespace: pluginNamespace }, callback] of onResolveMap) {
        if ((pluginNamespace && namespace !== pluginNamespace) || !(filter.test(path) || filter.test(absolutePath))) {
            continue;
        }
        heelHookSet.clear();
        result = await callback({
            ...args,
            absolutePath,
            importerOutfile: args.importer ? mapping_1.MapModule._cache[args.importer].outfile : '',
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
    let result = {};
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
    const esbuildPlugin = proxyPlugin(proxyResolveAct.bind(null, replacer, extensions, onResolveMap, heelHookSet), proxyLoadAct.bind(null, onLoadMap, heelHookSet));
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
async function narrowBuild(errorMarkup, options, overwrite = false) {
    const result = Object.create(null);
    try {
        const service = await esbuild_1.startService();
        const promises = [];
        options
            .filter((opt) => {
            const id = opt.entryPoints[0];
            const mod = mapping_1.MapModule._cache[id];
            if (!overwrite && mod?.write) {
                result[id] = mod;
                return false;
            }
            return true;
        })
            .forEach((opt) => {
            const infile = opt.entryPoints[0];
            const outfile = (opt.outfile = fileToOutfile(opt.outfile));
            const mod = new mapping_1.MapModule(infile, outfile);
            promises.push(service
                .build({
                ...opt,
                minify: true,
                keepNames: true,
                write: false,
            })
                .then((res) => {
                if (res?.outputFiles.length) {
                    for (let i = 0; i < res.outputFiles.length; i++) {
                        const { path, contents } = res.outputFiles[i];
                        mod.size = utils_1.formatBytes(contents.byteLength);
                        fs_extra_1.default.outputFileSync(path, contents);
                        mod.write = true;
                        result[infile] = mod;
                    }
                }
            }));
        });
        await Promise.all(promises);
        return result;
    }
    catch (e) {
        loglevel_1.default.error(`build error in ${errorMarkup}:`);
        loglevel_1.default.error(e);
        process.exit(1);
    }
}
async function entryHandler(srcs, plugins, publicDir) {
    const options = srcs.map((src) => {
        const outfile = fileToOutfile(src, '.js');
        return {
            entryPoints: [src],
            bundle: true,
            format: 'esm',
            outfile,
            plugins,
        };
    });
    await narrowBuild('entry file', options);
    await extendPlugin_1.overWriteHtml(publicDir);
}
exports.entryHandler = entryHandler;
function fileToOutfile(src, ext) {
    const dist = index_1.createTempDist();
    if (src.includes(dist)) {
        return src;
    }
    const { dir, name, ext: originExt } = path_1.default.parse(src);
    const splitdir = dir.split(process.cwd());
    const midpath = splitdir[0].length ? splitdir[0] : splitdir[1];
    ext = ext ?? originExt;
    return path_1.default.join(dist, midpath, `${name}${ext}`);
}
exports.fileToOutfile = fileToOutfile;
//# sourceMappingURL=agency.js.map