"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapModule = void 0;
class MapModule {
    constructor(id = '', outfile = '', autoAddCache = true) {
        this.size = '';
        this.write = false; // if write to file
        this.id = id;
        this.outfile = outfile;
        if (autoAddCache) {
            this.addCache();
        }
    }
    addCache() {
        MapModule._cache[this.id] = this;
    }
    clearCache() {
        MapModule._cache = Object.create(null);
    }
}
exports.MapModule = MapModule;
MapModule._cache = Object.create(null);
//# sourceMappingURL=mapping.js.map