"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reactPlugin = void 0;
const path_1 = __importDefault(require("path"));
exports.reactPlugin = {
    name: 'reactPlugin',
    setup(build) {
        // const path = require('path')
        build.onResolve({ filter: /^react$/ }, (args) => {
            console.log('onresolve----', args);
            return { path: path_1.default.join(args.resolveDir, 'aa', args.path) };
        });
        build.onLoad({ filter: /react$/ }, async (args) => {
            await new Promise((r) => {
                console.log(args);
                r(true);
            });
            return {};
        });
    },
};
exports.default = exports.reactPlugin;
//# sourceMappingURL=reactPlugin.js.map