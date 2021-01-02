"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.customModuleHandler = exports.createPlugins = exports.resolveModule = void 0;
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
async function createPlugins(plugins, config, ...args) {
    const dist = await index_1.createTempDist();
    const { resolve: { extensions, alias }, } = config;
    const esbuildPlugins = await Promise.all(plugins.map((fn) => exceptionHandle(fn, {
        dist,
        buildServe: wrapEsbuild_1.startBuildServe,
        config,
    }, resolveModule.bind(null, extensions, alias), ...args)));
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