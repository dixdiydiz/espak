// import log from 'loglevel'
import { generateConfig } from '../config'

// export const loggerName: symbol = Symbol('buildModule')

export async function command() {
  // log.trace('msg')
  // log.debug('debug')
  // log.info('info121')
  // log.warn('warn')
  // log.error('error')
  await generateConfig()
}
