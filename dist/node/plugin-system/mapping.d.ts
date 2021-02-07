export declare class MapModule {
    id: string;
    outfile: string;
    static _cache: Record<string, MapModule>;
    constructor(id?: string);
    addCache(): void;
    clearCache(): void;
}
