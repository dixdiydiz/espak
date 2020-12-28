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
exports.startBuildServe = exports.singleBuild = exports.buildConfig = void 0;
const esbuild_1 = require("esbuild");
const loglevel_1 = __importDefault(require("loglevel"));
const os_1 = __importDefault(require("os"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
// module from string ?
async function buildConfig(profile, prefix) {
    const tempDir = fs_extra_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'espak-'));
    const tmpPath = path_1.default.join(tempDir, `${prefix}.js`);
    await esbuild_1.build({
        entryPoints: [profile],
        platform: 'node',
        format: 'cjs',
        outfile: tmpPath,
    });
    const config = await Promise.resolve().then(() => __importStar(require(tmpPath)));
    fs_extra_1.default.removeSync(tempDir);
    return config.default || config;
}
exports.buildConfig = buildConfig;
async function singleBuild(option) {
    return await esbuild_1.build(option);
}
exports.singleBuild = singleBuild;
async function startBuildServe(options) {
    const service = await esbuild_1.startService();
    try {
        const promises = [];
        for (let o of options) {
            promises.push(service.build(o));
        }
        return await Promise.all(promises);
    }
    catch (e) {
        loglevel_1.default.error(e);
        return [];
    }
    finally {
        service.stop();
    }
}
exports.startBuildServe = startBuildServe;
//# sourceMappingURL=wrapEsBuild.js.map