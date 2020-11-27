"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const loglevel_1 = __importDefault(require("loglevel"));
const loglevel_plugin_prefix_1 = __importDefault(require("loglevel-plugin-prefix"));
const chalk_1 = __importDefault(require("chalk"));
const { version } = require('../../package.json');
const command_1 = require("./build/command");
const colors = {
    TRACE: chalk_1.default.cyan,
    DEBUG: chalk_1.default.blue,
    INFO: chalk_1.default.green,
    WARN: chalk_1.default.yellow,
    ERROR: chalk_1.default.red,
};
loglevel_plugin_prefix_1.default.reg(loglevel_1.default);
loglevel_1.default.enableAll();
loglevel_plugin_prefix_1.default.apply(loglevel_1.default, {
    format(level, name) {
        return `${colors[level.toUpperCase()](`[${level}]`)} ${chalk_1.default.gray(`${name}:`)}`;
    },
});
const program = new commander_1.Command();
program.version(version, '-v, -V, --version', 'output the current version');
program.command('serve').description('start service').action(serve);
program.command('build').description('build project').action(build);
program.parse(process.argv);
async function serve() {
    await 1;
    process.exit(0);
}
async function build() {
    await command_1.command();
    process.exit(0);
}
process.on('exit', (code) => {
    console.log('exit code:', code);
});
//# sourceMappingURL=index.js.map