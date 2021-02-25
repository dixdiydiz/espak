"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildServe = void 0;
const esbuild_1 = __importDefault(require("esbuild"));
const utils_1 = require("../utils");
async function buildServe(options) {
    if (!utils_1.isArray(options)) {
        options = [options];
    }
    const service = await esbuild_1.default.startService();
    try {
        const promises = [];
        for (let opt of options) {
            promises.push(service.build(opt));
        }
        return Promise.all(promises);
    }
    finally {
        service.stop();
    }
}
exports.buildServe = buildServe;
//# sourceMappingURL=esbuildService.js.map