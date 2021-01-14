import { Command } from 'commander'
import log from 'loglevel'
import os from 'os'
import path from 'path'
import fs from 'fs-extra'
import prefix from 'loglevel-plugin-prefix'
import chalk, { Chalk } from 'chalk'
const { version } = require('../../package.json')
import { command as buildCommand } from './build/command'

export type { EspakPlugin } from './transform/fabrication'

type LogKinds = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'

const colors: Record<LogKinds, Chalk> = {
  TRACE: chalk.cyan,
  DEBUG: chalk.blue,
  INFO: chalk.green,
  WARN: chalk.yellow,
  ERROR: chalk.red,
}

prefix.reg(log)
log.enableAll()

prefix.apply(log, {
  format(level, name) {
    return `${colors[level.toUpperCase() as LogKinds](`[${level}]`)} ${chalk.gray(`${name}:`)}`
  },
})

let dist: string
export async function createTempDist(): Promise<string> {
  if (dist) {
    return dist
  }
  try {
    dist = fs.mkdtempSync(path.join(os.tmpdir(), 'espak-'))
    log.info('dist', dist)
    return dist
  } catch (e) {
    log.error(chalk.red(e))
    process.exit(1)
  }
}

const program = new Command()
program.version(version, '-v, -V, --version', 'output the current version')
program.command('serve').description('start service').action(serve)
program.command('build').description('build project').action(build)
program.parse(process.argv)

async function serve(): Promise<void> {
  process.exit(0)
}

async function build(): Promise<void> {
  process.env.NODE_ENV = 'production' // developement
  const dist = await createTempDist()
  await buildCommand(dist)
  process.exit(0)
}

interface exitOption {
  exitCode: number
}
function exitHandler(
  option: exitOption = {
    exitCode: 0,
  }
): void {
  const { exitCode } = option
  if (dist) {
    fs.removeSync(dist)
  }
  log.info(chalk.magenta(`exitCode:--${exitCode}`))
  process.exit(exitCode)
}

process.on('exit', (code) => exitHandler({ exitCode: code }))
//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, { exitCode: 0 }))

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, { exitCode: 0 }))
process.on('SIGUSR2', exitHandler.bind(null, { exitCode: 0 }))

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, { exitCode: 0 }))
