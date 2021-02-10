import { UserConfig } from '../config';
import { Plugin as EsbuildPlugin, OnResolveOptions as EsbuildOnResolveOptions, OnResolveArgs as EsbuildOnResolveArgs, OnResolveResult as EsbuildOnResolveResult, OnLoadOptions as EsbuildOnLoadOptions, OnLoadArgs as EsbuildOnLoadArgs, OnLoadResult as EsbuildOnLoadResult, BuildOptions } from 'esbuild';
export interface ProxyPlugin {
    (proxyResolveAct: (args: EsbuildOnResolveArgs) => Promise<OnResolveResult>, proxyLoadAct: (args: EsbuildOnLoadArgs) => Promise<OnLoadResult>): EsbuildPlugin | Promise<EsbuildPlugin>;
}
interface OnResolveArgs {
    path: string;
    absolutePath: string;
    importer: string;
    namespace: string;
    resolveDir: string;
}
declare type OnResolveResult = EsbuildOnResolveResult | null | undefined;
interface OnResolveCallback {
    (args: OnResolveArgs): OnResolveResult | Promise<OnResolveResult>;
    _pluginName?: string;
}
declare type OnLoadResult = EsbuildOnLoadResult | null | undefined;
interface OnLoadCallback {
    (args: EsbuildOnLoadArgs): OnLoadResult;
    _pluginName?: string;
}
declare type HeelHookCallback = (pluginData: any) => any;
export interface PluginBuild {
    onResolve(options: EsbuildOnResolveOptions, callback: OnResolveCallback): void;
    onLoad(options: EsbuildOnLoadOptions, callback: OnLoadCallback): void;
    heelHook(callback: HeelHookCallback): void;
    triggerBuild(options: BuildOptions): Promise<any>;
}
export interface Plugin {
    name: string;
    setup: (build: PluginBuild) => void;
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
export declare type TriggerBuildOptions = Omit<BuildOptions, 'outdir'>;
export declare function constructEsbuildPlugin(proxyPlugin: ProxyPlugin, plugins: PendingPlugin[], config: UserConfig): Promise<EsbuildPlugin>;
export declare function entryHandler(srcs: string[], plugins: EsbuildPlugin[]): Promise<void>;
export {};
