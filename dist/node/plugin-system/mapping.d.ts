export declare class MapModule {
    id: string;
    outfile: string;
    size: string;
    write: boolean;
    static _cache: Record<string, MapModule>;
    constructor(id?: string, outfile?: string, autoAddCache?: boolean);
    addCache(): void;
    clearCache(): void;
}
