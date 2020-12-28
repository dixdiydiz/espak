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
const fabrication_1 = require("./fabrication");
const loglevel_1 = __importDefault(require("loglevel"));
const utils_1 = require("../utils");
const webModulePlugin = async (external) => {
    const path = await fabrication_1.resolveModule('./package.json', {
        basedir: process.cwd(),
    });
    const packageDependencies = await Promise.resolve().then(() => __importStar(require(path))).then((r) => {
        const { dependencies = {} } = r;
        return Object.keys(dependencies);
    })
        .catch((e) => {
        loglevel_1.default.error(e);
        return [];
    });
    const onResolveItems = utils_1.isArray(external)
        ? packageDependencies.filter((ele) => !external.includes(ele))
        : packageDependencies;
    return (dist, service) => {
        onResolveItems.forEach((ele) => { });
        console.log(onResolveItems, dist, service);
        return {
            name: 'webModulePlugin',
            setup({ onResolve }) {
                onResolveItems.forEach((ele) => {
                    onResolve({ filter: new RegExp(`^${ele}$`) }, (args) => {
                        console.log(args.path, args.importer, args.resolveDir);
                        return {
                            path: args.path,
                            external: true,
                        };
                    });
                });
            },
        };
    };
};
exports.default = webModulePlugin;
//# sourceMappingURL=webModulePlugin.js.map