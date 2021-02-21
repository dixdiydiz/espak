"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateConfig = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const loglevel_1 = __importDefault(require("loglevel"));
const require_module_from_string_1 = __importDefault(require("require-module-from-string"));
const utils_1 = require("./utils");
async function generateConfig() {
    const prefix = 'espak.config';
    const supportedConfigExt = ['.json', '.js', '.ts'];
    let userConfig = Object.create(null);
    try {
        for (let ext of supportedConfigExt) {
            const profile = path_1.default.resolve(`${prefix}${ext}`);
            if (fs_extra_1.default.pathExistsSync(profile)) {
                switch (ext) {
                    case '.json':
                    case '.js':
                        userConfig = await Promise.resolve().then(() => __importStar(require(profile)));
                        break;
                    case '.ts': {
                        userConfig = await require_module_from_string_1.default('', profile);
                    }
                }
                break;
            }
        }
    }
    catch (e) {
        loglevel_1.default.error(e);
        loglevel_1.default.warn('configuration file is not available, exit.');
        process.exit(1);
    }
    const { publicDir = path_1.default.join(process.cwd(), './public'), entry = 'src/index.js', outputDir = 'dist', external, plugins, resolve, } = userConfig;
    const defaultResolve = {
        extensions: ['.tsx', '.ts', '.jsx', '.js'],
    };
    return Object.freeze({
        publicDir,
        entry,
        outputDir,
        resolve: handleResovle(resolve, defaultResolve),
        external,
        plugins: utils_1.isArray(plugins) ? plugins : [],
    });
    function handleResovle(resolve = {}, defaultResolve = {}) {
        const extensions = [...new Set([...(resolve.extensions || []), ...(defaultResolve.extensions || [])])];
        const result = {
            extensions,
        };
        if (resolve.alias) {
            result.alias = resolve.alias;
        }
        return result;
    }
}
exports.generateConfig = generateConfig;
//# sourceMappingURL=config.js.map