import { Command } from 'commander'
import { version as packageVersion } from '../../package.json'

const program = new Command()

async function build(): Promise<void> {
  console.log('aaa')
}
