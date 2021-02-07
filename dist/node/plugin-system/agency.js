"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.constructEsbuildPlugin = exports.connectConfigHelper = void 0;
// import resolve from 'resolve'
const loglevel_1 = __importDefault(require("loglevel"));
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
    const onResolveMap = new Map();
    const onLoadMap = new Map();
    for (let cb of pendingPlugins) {
        const { name = '', setup } = '_needConfig' in cb ? await cb(config) : cb;
        try {
            setup({
                onResolve: onResolve(name),
                onLoad: onLoad(name),
            });
        }
        catch (e) {
            loglevel_1.default.error(`plugin ${name} error: ${e}`);
        }
    }
    return {
        onResolveMap,
        onLoadMap,
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
    // function
}
function constructEsbuildPlugin(proxyPlugin, plugins, config) {
    const onResolves = null;
    const onLoads = null;
    return proxyPlugin({
        onResolves,
        onLoads,
    });
}
exports.constructEsbuildPlugin = constructEsbuildPlugin;
//# sourceMappingURL=agency.js.map