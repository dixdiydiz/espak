export class MapModule {
  id: string
  outfile: string
  size: string = ''
  write: boolean = false // if write to file
  static _cache: Record<string, MapModule> = Object.create(null)
  constructor(id: string = '', outfile: string = '', autoAddCache: boolean = true) {
    this.id = id
    this.outfile = outfile
    if (autoAddCache) {
      this.addCache()
    }
  }
  addCache() {
    MapModule._cache[this.id] = this
  }
  clearCache() {
    MapModule._cache = Object.create(null)
  }
}
