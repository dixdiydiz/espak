export type { EspakPlugin } from './transform/fabrication';
export interface TempDist {
    temp: string;
    tempSrc: string;
    tempModule: string;
}
export declare function createTempDist(): Promise<TempDist>;
