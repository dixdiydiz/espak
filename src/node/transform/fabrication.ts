// import { builtinModules } from 'module'
import resolve from 'resolve'
import log from 'loglevel'

interface RawInModule {
  infile: string
  outfile?: string
  dir?: string
  label?: string
  text: string
}

const importedReg = /(?:import\((?:(?:'(\S+)')|(?:"(\S+)"))\))|(?:import\s*(?:(?:'(\S+)')|(?:"(\S+)"));)|(?:import\s+[^;\"\']+from\s*(?:(?:'([^\s\']+)')|(?:"([^\s\"]+)"));)/g

export async function handleImportation(input: RawInModule): Promise<any> {
  const { dir, text } = input
  const matchs = text.matchAll(importedReg)
  for (let m of matchs) {
    // const match = {
    //   match: m[0],
    //   start: m.index,
    //   end: m.index! + m[0].length,
    // }
    // console.log(match)
    searchAbsolutePath(m.slice(1, 7), { basedir: dir })
  }
  function searchAbsolutePath(match: string[], options: any) {
    const relativePath: string | undefined = match.find((e: string | undefined) => e !== undefined)
    try {
      if (typeof relativePath === 'string') {
        const absolutePath = resolve.sync(relativePath, {
          extensions: ['.tsx', '.ts', '.jsx', '.js'],
          ...options,
        })
        console.log(absolutePath)
      }
    } catch (e) {
      log.warn(e)
    }
  }
}
