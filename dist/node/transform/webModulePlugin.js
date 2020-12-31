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
const path_1 = __importDefault(require("path"));
const utils_1 = require("../utils");
const webModulePlugin = async (external) => {
    const pkgPath = fabrication_1.resolveModule('./package.json', {
        basedir: process.cwd(),
    });
    const packageDependencies = await Promise.resolve().then(() => __importStar(require(pkgPath))).then((r) => {
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
    const mapPaths = Object.create(null);
    onResolveItems.forEach((ele) => {
        mapPaths[ele] = fabrication_1.resolveModule(ele, {
            basedir: process.cwd(),
        });
    });
    return async ({ dist, buildServe }) => {
        const buildOptions = Object.entries(mapPaths).map(([key, val]) => ({
            entryPoints: [val],
            outfile: path_1.default.join(dist.tempModule, `${key}.js`),
            bundle: true,
            minify: true,
            format: 'esm',
            define: {
                'process.env.NODE_ENV': `'"${process.env.NODE_ENV}"'` || '"production"',
            },
        }));
        await buildServe(buildOptions);
        return {
            name: 'webModulePlugin',
            setup({ onResolve }) {
                onResolveItems.forEach((ele) => {
                    onResolve({ filter: new RegExp(`^${ele}$`) }, (args) => {
                        const to = path_1.default.join(process.cwd(), 'module/');
                        const { dir } = path_1.default.parse(args.importer);
                        return {
                            path: path_1.default.join(path_1.default.relative(dir, to), `${ele}.js`),
                            external: true,
                        };
                    });
                });
                if (utils_1.isArray(external)) {
                    external.forEach((ele) => {
                        onResolve({ filter: new RegExp(`^${ele}$`) }, (args) => {
                            return {
                                namespace: ele,
                            };
                        });
                    });
                }
            },
        };
    };
};
exports.default = webModulePlugin;
//# sourceMappingURL=webModulePlugin.js.map