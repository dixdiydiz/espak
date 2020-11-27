"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
const loglevel_1 = __importDefault(require("loglevel"));
const config_1 = require("../config");
// export const loggerName: symbol = Symbol('buildModule')
async function command() {
    // log.trace('msg')
    // log.debug('debug')
    loglevel_1.default.info('info121');
    // log.warn('warn')
    // log.error('error')
    await config_1.generateConfig();
}
exports.command = command;
//# sourceMappingURL=command.js.map