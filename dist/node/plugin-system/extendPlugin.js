"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clonePublicDir = exports.generateIndexHtmlHook = exports.generateHtmlChain = void 0;
const loglevel_1 = __importDefault(require("loglevel"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const index_1 = require("../index");
function generateIndexHtmlHook(cb) {
    const nextChain = {
        action: cb,
        next: null,
    };
    if (exports.generateHtmlChain) {
        exports.generateHtmlChain.last.next = nextChain;
        exports.generateHtmlChain.last = nextChain;
    }
    else {
        exports.generateHtmlChain = {
            ...nextChain,
            last: exports.generateHtmlChain,
        };
    }
}
exports.generateIndexHtmlHook = generateIndexHtmlHook;
async function clonePublicDir(publicdir) {
    const distDir = await index_1.createTempDist();
    try {
        await fs_extra_1.default.copy(publicdir, distDir, {
            overwrite: false,
        });
    }
    catch (e) {
        loglevel_1.default.error(e);
        process.exit(1);
    }
}
exports.clonePublicDir = clonePublicDir;
//# sourceMappingURL=extendPlugin.js.map