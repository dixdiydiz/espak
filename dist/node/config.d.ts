export interface UserConfig {
    public?: string;
    entry?: string | Record<string, string>;
    output?: string;
}
export declare function generateConfig(): Promise<void>;
