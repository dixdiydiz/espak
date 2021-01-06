import { UserConfig } from '../config';
import { BuildOptions, Plugin, OnResolveArgs } from 'esbuild';
interface ResolveModuleResult {
    resolvepath: string;
    root: string;
    dir: string;
    base: string;
    ext: string;
    name: string;
    relativedir: string;
    relativepath: string;
}
export declare function resolveModule(extensions: string[], alias: unknown, to: string, from: string): ResolveModuleResult;
export interface EspakPlugin extends Plugin {
    namespace?: string;
}
export interface EspakOnResolveArgs extends OnResolveArgs {
}
export interface BuildUtil {
    namespaces?: string[];
}
export declare type SimplePlugin = (util: BuildUtil, onResolves: any, onLoads: any) => Promise<Plugin>;
export declare function createPlugin(simplePlugin: SimplePlugin, plugins: EspakPlugin[], config: UserConfig): Promise<Plugin>;
export declare function customModuleHandler(src: string[], option: BuildOptions): Promise<void>;
export {};
