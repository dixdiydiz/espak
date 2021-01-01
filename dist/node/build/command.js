"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const loglevel_1 = __importDefault(require("loglevel"));
const path_1 = __importDefault(require("path"));
const resolve_1 = __importDefault(require("resolve"));
const utils_1 = require("../utils");
const webModulePlugin_1 = __importDefault(require("../transform/webModulePlugin"));
const plainPlugin_1 = __importDefault(require("../transform/plainPlugin"));
const config_1 = require("../config");
const fabrication_1 = require("../transform/fabrication");
async function command(dist) {
    const config = await config_1.generateConfig();
    const { entry: configEntry, external, plugins: customPlugins } = config;
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
    const builtinPlugins = await Promise.all([webModulePlugin_1.default(utils_1.isArray(external) ? external : [])]);
    const plugins = await fabrication_1.createPlugins([...builtinPlugins, ...customPlugins], config);
    const plainEsbuildPlugin = await fabrication_1.createPlugins([plainPlugin_1.default], config, plugins);
    await fabrication_1.customModuleHandler(entries, {
        outdir: dist.tempSrc,
        outbase: 'src',
        plugins: [...plainEsbuildPlugin, ...plugins],
    });
}
exports.command = command;
//# sourceMappingURL=command.js.map