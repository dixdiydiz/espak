"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatBytes = exports.isPlainPromise = exports.isStringObject = exports.toRawType = exports.toTypeString = exports.objectToString = exports.isPromise = exports.isObject = exports.isFunction = exports.isArray = exports.isNumber = exports.isSymbol = exports.isString = void 0;
// type assertion
const isString = (val) => typeof val === 'string';
exports.isString = isString;
const isSymbol = (val) => typeof val === 'symbol';
exports.isSymbol = isSymbol;
const isNumber = (val) => typeof val === 'number';
exports.isNumber = isNumber;
exports.isArray = Array.isArray;
const isFunction = (val) => typeof val === 'function';
exports.isFunction = isFunction;
const isObject = (val) => val !== null && typeof val === 'object';
exports.isObject = isObject;
// take thenable as promise
const isPromise = (val) => exports.isObject(val) && exports.isFunction(val.then) && exports.isFunction(val.catch);
exports.isPromise = isPromise;
exports.objectToString = Object.prototype.toString;
const toTypeString = (val) => exports.objectToString.call(val);
exports.toTypeString = toTypeString;
const toRawType = (val) => exports.toTypeString(val).slice(8, -1);
exports.toRawType = toRawType;
const isStringObject = (val) => !exports.isString(val) && exports.toTypeString(val) === '[object String]';
exports.isStringObject = isStringObject;
const isPlainPromise = (val) => exports.toTypeString(val) === '[object Promise]';
exports.isPlainPromise = isPlainPromise;
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
exports.formatBytes = formatBytes;
//# sourceMappingURL=utils.js.map