"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTempDist = void 0;
const commander_1 = require("commander");
const loglevel_1 = __importDefault(require("loglevel"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
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
let dist;
async function createTempDist() {
    if (dist) {
        return dist;
    }
    try {
        dist = fs_extra_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'espak-'));
        loglevel_1.default.info('dist', dist);
        return dist;
    }
    catch (e) {
        loglevel_1.default.error(chalk_1.default.red(e));
        process.exit(1);
    }
}
exports.createTempDist = createTempDist;
const program = new commander_1.Command();
program.version(version, '-v, -V, --version', 'output the current version');
program.command('serve').description('start service').action(serve);
program.command('build').description('build project').action(build);
program.parse(process.argv);
async function serve() {
    process.exit(0);
}
async function build() {
    process.env.NODE_ENV = 'production'; // developement
    const dist = await createTempDist();
    await command_1.command(dist);
    process.exit(0);
}
function exitHandler(option = {
    exitCode: 0,
}) {
    const { exitCode } = option;
    if (dist) {
        // fs.removeSync(dist)
    }
    loglevel_1.default.info(chalk_1.default.magenta(`exitCode:--${exitCode}`));
    process.exit(exitCode);
}
process.on('exit', (code) => exitHandler({ exitCode: code }));
//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, { exitCode: 0 }));
// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, { exitCode: 0 }));
process.on('SIGUSR2', exitHandler.bind(null, { exitCode: 0 }));
//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, { exitCode: 0 }));
//# sourceMappingURL=index.js.map