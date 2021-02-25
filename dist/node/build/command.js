"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const loglevel_1 = __importDefault(require("loglevel"));
const path_1 = __importDefault(require("path"));
const resolve_1 = __importDefault(require("resolve"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const config_1 = require("../config");
const customModulePlugin_1 = __importDefault(require("./customModulePlugin"));
const webModulePlugin_1 = __importDefault(require("./webModulePlugin"));
const agency_1 = require("../plugin-system/agency");
const proxyPlugin_1 = __importDefault(require("../plugin-system/proxyPlugin"));
async function command(dist) {
    const config = await config_1.generateConfig();
    const { entry: configEntry, plugins, outputDir, publicDir } = config;
    const supportedExtensions = ['.tsx', '.ts', '.jsx', '.js'];
    const entries = [];
    for (let [_, val] of Object.entries(configEntry)) {
        const infile = resolve_1.default.sync(path_1.default.resolve('./', val), {
            basedir: process.cwd(),
            extensions: supportedExtensions,
        });
        if (infile) {
            const { ext } = path_1.default.parse(infile);
            if (supportedExtensions.includes(ext)) {
                entries.push(infile);
            }
            else {
                loglevel_1.default.error(`entry file ext do not support ${ext}: ${infile}`);
            }
        }
    }
    const modulePlugin = await agency_1.connectConfigHelper(webModulePlugin_1.default, [
        'external',
        'cjsModule',
    ]);
    const plugin = await agency_1.constructEsbuildPlugin(proxyPlugin_1.default, [modulePlugin, customModulePlugin_1.default, ...plugins], config);
    await agency_1.entryHandler(entries, [plugin], publicDir);
    const absoluteOutputDir = path_1.default.resolve(process.cwd(), outputDir);
    await cloneDist(dist, absoluteOutputDir);
}
exports.command = command;
async function cloneDist(from, to) {
    try {
        await fs_extra_1.default.copy(from, to);
    }
    catch (e) {
        loglevel_1.default.error(`output error: ${e}`);
        process.exit(1);
    }
}
//# sourceMappingURL=command.js.map