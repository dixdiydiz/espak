// import log from 'loglevel'
import { generateConfig, UserConfig } from '../config'

// export const loggerName: symbol = Symbol('buildModule')

export async function command(): Promise<void> {
  const config: UserConfig = await generateConfig()
}
