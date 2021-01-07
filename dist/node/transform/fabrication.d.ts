import { UserConfig } from '../config';
import { Plugin, OnResolveOptions, OnResolveArgs, OnResolveResult, OnLoadOptions, OnLoadArgs, OnLoadResult, BuildOptions } from 'esbuild';
import { TempDist } from '../index';
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
/**
 * rewrite esbuild plugin types
 * start
 */
export interface EspakBuildOptions extends BuildOptions {
    sourcefile?: string;
}
export interface EspakOnResolveResult extends OnResolveResult {
    buildOptions?: EspakBuildOptions;
}
declare type OnResloveCallback = (args: OnResolveArgs) => EspakOnResolveResult | null | undefined | Promise<EspakOnResolveResult | null | undefined>;
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
    dist: TempDist;
    plugins: EspakPlugin[];
}
export declare function entryHandler(src: string[], option: CustomBuildOption): Promise<void>;
export {};
