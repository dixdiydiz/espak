import { PendingPlugin } from './plugin-system/agency';
export interface Resolve {
    alias?: Record<string, string>;
    extensions: string[];
}
export interface UserConfig {
    publicDir: string;
    entry: string | Record<string, string> | string[];
    outputDir: string;
    resolve: Resolve;
    external?: string[];
    cjsModule?: Record<string, string>;
    plugins: PendingPlugin[];
}
export declare function generateConfig(): Promise<UserConfig>;
