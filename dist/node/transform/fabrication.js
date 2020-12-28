"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.customModuleHandler = exports.createPlugins = exports.resolveModule = void 0;
// import { builtinModules } from 'module'
const resolve_1 = __importDefault(require("resolve"));
const loglevel_1 = __importDefault(require("loglevel"));
const wrapEsbuild_1 = require("./wrapEsbuild");
const index_1 = require("../index");
function resolveModule(pathSource, options) {
    const infile = resolve_1.default.sync(pathSource, options);
    return infile;
}
exports.resolveModule = resolveModule;
async function createPlugins(plugins) {
    console.log('plugins:---', plugins);
    const dist = await index_1.createTempDist();
    const esbuildPlugins = await Promise.all(plugins.map((fn) => exceptionHandle(fn, dist, wrapEsbuild_1.startBuildServe)));
    return esbuildPlugins.filter((ele) => ele);
}
exports.createPlugins = createPlugins;
async function exceptionHandle(fn, ...args) {
    try {
        return await fn(...args);
    }
    catch (e) {
        loglevel_1.default.error(e);
        return null;
    }
}
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