// type assertion
export const isString = (val: unknown): val is string => typeof val === 'string'
export const isSymbol = (val: unknown): val is symbol => typeof val === 'symbol'
export const isNumber = (val: unknown): val is number => typeof val === 'number'
export const { isArray } = Array
export const isFunction = (val: unknown): val is Function => typeof val === 'function'
export const isObject = (val: unknown): val is Record<any, any> => val !== null && typeof val === 'object'
// take thenable as promise
export const isPromise = <T = any>(val: unknown): val is Promise<T> =>
  isObject(val) && isFunction(val.then) && isFunction(val.catch)

export const objectToString = Object.prototype.toString
export const toTypeString = (val: unknown): string => objectToString.call(val)
export const toRawType = (val: unknown): string => toTypeString(val).slice(8, -1)

export const isStringObject = (val: unknown): val is String => !isString(val) && toTypeString(val) === '[object String]'
export const isPlainPromise = <T = any>(val: unknown): val is Promise<T> => toTypeString(val) === '[object Promise]'

export function formatBytes(bytes: number, decimals: number = 2) {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}
