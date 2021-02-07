export class MapModule {
  id: string
  outfile: string = ''
  static _cache: Record<string, MapModule> = Object.create(null)
  constructor(id: string = '') {
    this.id = id
  }
  addCache() {
    MapModule._cache[this.id] = this
  }
  clearCache() {
    MapModule._cache = Object.create(null)
  }
}
