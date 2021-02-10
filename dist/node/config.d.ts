import { PendingPlugin } from './plugin-system/agency';
export interface Resolve {
    alias?: Record<string, string>;
    extensions: string[];
}
export interface UserConfig {
    public: string;
    entry: string | Record<string, string> | string[];
    outputDir: string;
    resolve: Resolve;
    external: string[] | undefined;
    plugins: PendingPlugin[];
}
export declare function generateConfig(): Promise<UserConfig>;
