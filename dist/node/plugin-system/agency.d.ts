import { UserConfig } from '../config';
import { Plugin as EsbuildPlugin, OnResolveOptions, OnResolveArgs as EsbuildOnResolveArgs, OnResolveResult, OnLoadOptions, OnLoadArgs, OnLoadResult, BuildOptions as EsbuildBuildOptions } from 'esbuild';
import { MapModule } from './mapping';
import { GenerateIndexHtml } from './extendPlugin';
export interface ProxyPlugin {
    (proxyResolveMap: Map<OnResolveOptions, (args: EsbuildOnResolveArgs) => Promise<OnResolveResult>>, proxyLoadMap: Map<OnLoadOptions, (args: OnLoadArgs) => Promise<OnLoadResult>>): EsbuildPlugin;
}
interface OnResolveArgs extends EsbuildOnResolveArgs {
    importerOutfile: string;
}
interface OnResolveCallback {
    (args: OnResolveArgs): OnResolveResult | Promise<OnResolveResult>;
    _pluginName?: string;
}
interface OnLoadCallback {
    (args: OnLoadArgs): OnLoadResult;
    _pluginName?: string;
}
declare type HeelHookCallback = (pluginData: any) => any;
export interface BuildOptions extends Omit<EsbuildBuildOptions, 'outdir' | 'outbase'> {
    entryPoints: [string];
    outfile: string;
}
export interface PluginBuild {
    onResolve(options: OnResolveOptions, callback: OnResolveCallback): void;
    onLoad(options: OnLoadOptions, callback: OnLoadCallback): void;
    heelHook(callback: HeelHookCallback): void;
    triggerBuild(options: BuildOptions): Promise<Record<string, MapModule>>;
}
export interface Plugin {
    name?: string;
    setup?: (build: PluginBuild) => void;
    generateIndexHtml?: Partial<GenerateIndexHtml>;
}
/**
 * rewrite esbuild some inner interface
 * end
 */
export interface ConnectConfigHelper {
    (config: UserConfig): Promise<Plugin>;
    _needConfig: boolean;
}
declare type ValOfConfig<T> = T extends any[] ? T : T extends (...args: infer U) => Plugin | Promise<Plugin> ? U : T[];
export declare function connectConfigHelper<T = any[]>(callback: (...args: ValOfConfig<T>) => Plugin | Promise<Plugin>, args: string[]): ConnectConfigHelper;
export declare type PendingPlugin = ConnectConfigHelper | Plugin;
export declare function constructEsbuildPlugin(proxyPlugin: ProxyPlugin, plugins: PendingPlugin[], config: UserConfig): Promise<EsbuildPlugin>;
export declare function entryHandler(srcs: string[], plugins: EsbuildPlugin[], publicDir: string): Promise<void>;
export declare function fileToOutfile(src: string, ext?: string): string;
export {};
