import { UserConfig } from '../config';
import { Plugin, OnResolveOptions, OnResolveArgs, OnResolveResult, OnLoadOptions, OnLoadArgs, OnLoadResult, BuildOptions } from 'esbuild';
interface ResolveModuleResult {
    modulePath: string;
    name: string;
}
export declare function resolveModule(extensions: string[], alias: unknown, to: string, fromdir: string): ResolveModuleResult;
/**
 * rewrite esbuild plugin types
 * start
 */
export interface EspakOnResolveArgs extends OnResolveArgs {
    modulePath: string;
}
export interface EspakBuildOptions extends BuildOptions {
    sourcePath?: string;
    outputDir?: string;
    outputExtension?: string;
    fileName?: string;
    key?: string;
}
export interface EspakOnResolveResult extends OnResolveResult {
    outputOptions?: EspakBuildOptions;
    buildOptions?: BuildOptions;
}
declare type OnResloveCallback = (args: EspakOnResolveArgs) => EspakOnResolveResult | null | undefined | Promise<EspakOnResolveResult | null | undefined>;
declare type OnLoadCallback = (args: OnLoadArgs) => OnLoadResult | null | undefined | Promise<OnLoadResult | null | undefined>;
export interface PluginBuild {
    onResolve(options: OnResolveOptions, callback: OnResloveCallback): void;
    onLoad(options: OnLoadOptions, callback: OnLoadCallback): void;
}
export interface EspakPlugin {
    name: string;
    setup: (build: PluginBuild) => void;
    namespace?: string;
}
/**
 * rewrite esbuild plugin types
 * end
 */
export interface BuildUtil {
    namespaces?: string[];
}
export declare type ProxyPlugin = (util: BuildUtil, onResolves: (args: OnResolveArgs, plugin: Plugin) => Promise<any>, onLoads: any) => Promise<Plugin>;
export declare function createPlugin(proxyPlugin: ProxyPlugin, plugins: EspakPlugin[], config: UserConfig): Promise<Plugin>;
interface CustomBuildOption {
    dist: string;
    plugins: Plugin[];
}
export declare function entryHandler(src: string[], option: CustomBuildOption): Promise<void>;
export {};
