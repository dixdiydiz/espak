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
const proxyPlugin_1 = __importDefault(require("../transform/proxyPlugin"));
const config_1 = require("../config");
const fabrication_1 = require("../transform/fabrication");
const webModulePlugin_1 = __importDefault(require("../transform/webModulePlugin"));
const customModulePlugin_1 = __importDefault(require("../transform/customModulePlugin"));
const utils_1 = require("../../utils");
async function command(dist) {
    const config = await config_1.generateConfig();
    const { entry: configEntry, external, plugins, outputDir } = config;
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
    const modulePlugin = await webModulePlugin_1.default(utils_1.isArray(external) ? external : []);
    const combinePlugins = [modulePlugin, customModulePlugin_1.default, ...plugins];
    const plugin = await fabrication_1.createPlugin(proxyPlugin_1.default, combinePlugins, config);
    await fabrication_1.entryHandler(entries, {
        dist,
        plugins: [plugin],
    });
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