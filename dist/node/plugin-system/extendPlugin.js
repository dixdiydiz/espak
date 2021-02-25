"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.overWriteHtml = exports.generateIndexHtmlHook = exports.generateHtmlChain = void 0;
const loglevel_1 = __importDefault(require("loglevel"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const index_1 = require("../index");
const path_1 = __importDefault(require("path"));
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
async function clonePublicDir(publicDir) {
    const distDir = await index_1.createTempDist();
    try {
        await fs_extra_1.default.copy(publicDir, distDir, {
            overwrite: false,
        });
    }
    catch (e) {
        loglevel_1.default.error(e);
        process.exit(1);
    }
}
async function overWriteHtml(publicDir) {
    if (publicDir) {
        await clonePublicDir(publicDir);
    }
    try {
        const indexPath = path_1.default.join(publicDir, 'index.html');
        let chain = exports.generateHtmlChain;
        if (chain) {
            let content = fs_extra_1.default.readFileSync(indexPath, 'utf8');
            do {
                content = chain.action(content);
                chain = chain.next;
            } while (chain);
            await fs_extra_1.default.outputFile(indexPath, content);
        }
    }
    catch (e) {
        loglevel_1.default.error(e);
        process.exit(1);
    }
}
exports.overWriteHtml = overWriteHtml;
//# sourceMappingURL=extendPlugin.js.map