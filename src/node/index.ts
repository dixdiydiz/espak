import { Command } from 'commander'
import log from 'loglevel'
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
  await buildCommand()
  process.exit(0)
}

process.on('exit', (code) => {
  console.log('exit code:', code)
})
