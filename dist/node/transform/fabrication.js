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
        if ([rawModulePath, modulePath].some((ele) => filter.test(ele)) && namespace === importerNamespace) {
            const resolveResult = await callback({ ...args, modulePath });
            let relative = '';
            if (resolveResult?.outputOptions) {
                const { sourcePath, fileName = '', key = '', outputDir = '', outputExtension = '.js', } = resolveResult.outputOptions;
                const buildOptions = utils_1.isObject(resolveResult.buildOptions) ? resolveResult.buildOptions : {};
                Reflect.deleteProperty(resolveResult, 'outputOptions');
                Reflect.deleteProperty(resolveResult, 'buildOptions');
                const entry = sourcePath || modulePath;
                if (infileToOutfile[entry]) {
                    relative = path_1.default.relative(infileToOutfile[importer], infileToOutfile[entry]);
                }
                else {
                    const outfile = path_1.default.resolve(dist, outputDir, `${fileName || name}${key ? `-${key}` : ''}${outputExtension}`);
                    try {
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
                        infileToOutfile[entry] = outfile;
                        relative = path_1.default.relative(infileToOutfile[importer], outfile);
                    }
                    catch (e) {
                        loglevel_1.default.error(e);
                        process.exit(1);
                    }
                }
            }
            return {
                ...resolveResult,
                path: resolveResult?.path || relative,
            };
        }
    }
    return null;
}
async function onLoads(resolveFn, loadMap, args, esbuildPlugin) {
    const { path, namespace: argsNamespace } = args;
    const dist = await index_1.createTempDist();
    // for (let [key, value] of resolveMap) {
    //   const { filter, namespace } = key
    // }
    return null;
}
function verifyOnResolveResult(pluginName, resolveResult) {
    const support = ['path', 'external', 'namespace', 'errors', 'warnings', 'pluginName'];
    let result;
    let outputOptions;
    let buildOptions;
    if (utils_1.isObject(resolveResult)) {
        result = Object.create(null);
        outputOptions = resolveResult.outputOptions;
        buildOptions = resolveResult.buildOptions;
        Reflect.deleteProperty(resolveResult, outputOptions);
        for (let [key, val] of Object.entries(resolveResult)) {
            if (support.includes(key)) {
            }
        }
    }
    return {
        resolveResult: result,
        outputOptions,
        buildOptions,
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