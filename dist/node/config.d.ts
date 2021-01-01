import { EspakPlugin } from './transform/fabrication';
export interface Resolve {
    alias?: Record<string, string>;
    extensions: string[];
}
export interface UserConfig {
    public: string;
    entry: string | Record<string, string> | string[];
    output: string;
    resolve: Resolve;
    external: string[] | undefined;
    plugins: EspakPlugin[];
}
export declare function generateConfig(): Promise<UserConfig>;
