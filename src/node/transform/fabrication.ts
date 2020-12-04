// import { builtinModules } from 'module'

interface RawInModule {
  in: string
  label?: string
  text: string
}

const importedReg = /(?:import\((?:(?:'(\S+)')|(?:"(\S+)"))\))|(?:import\s*(?:(?:'(\S+)')|(?:"(\S+)"));)|(?:import\s+[^;\"\']+from\s*(?:(?:'([^\s\']+)')|(?:"([^\s\"]+)"));)/g

export async function handleImportation(input: RawInModule): Promise<any> {
  const { text } = input
  const matchs = text.matchAll(importedReg)
  for (let m of matchs) {
    console.log(m)
    const match = {
      match: m[0],
      start: m.index,
      end: m.index! + m[0].length,

    }
    // console.log(match)
  }

  function
}
