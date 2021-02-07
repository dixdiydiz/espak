"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapModule = void 0;
class MapModule {
    constructor(id = '') {
        this.outfile = '';
        this.id = id;
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