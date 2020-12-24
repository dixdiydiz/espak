import { Command } from 'commander'
import log from 'loglevel'
import os from 'os'
import path from 'path'
import fs from 'fs-extra'
import prefix from 'loglevel-plugin-prefix'
import chalk, { Chalk } from 'chalk'
const { version } = require('../../package.json')
import { command as buildCommand } from './build/command'

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

export let espakTemp: string = ''
export let espakTempSrc: string = ''
export let espakTempModule: string = ''
;(function () {
  try {
    espakTemp = fs.mkdtempSync(path.join(os.tmpdir(), 'espak-'))
    espakTempSrc = path.join(espakTemp, 'src')
    espakTempModule = path.join(espakTemp, 'module')
    log.info('espakTemp', espakTemp)
  } catch (e) {
    log.error(chalk.red(e))
    process.exit(1)
  }
})()

const program = new Command()
program.version(version, '-v, -V, --version', 'output the current version')
program.command('serve').description('start service').action(serve)
program.command('build').description('build project').action(build)
program.parse(process.argv)

async function serve(): Promise<void> {
  await 1
  process.exit(0)
}

async function build(): Promise<void> {
  process.env.NODE_ENV = 'production' // developement
  await buildCommand()
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
  fs.removeSync(espakTemp)
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
