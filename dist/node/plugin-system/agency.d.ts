import { UserConfig } from '../config';
import { Plugin as EsbuildPlugin, OnResolveOptions as EsbuildOnResolveOptions, OnResolveArgs as EsbuildOnResolveArgs, OnResolveResult as EsbuildOnResolveResult, OnLoadOptions as EsbuildOnLoadOptions, OnLoadArgs as EsbuildOnLoadArgs, OnLoadResult as EsbuildOnLoadResult } from 'esbuild';
export interface ProxyPlugin {
    (onResolves: (args: EsbuildOnResolveArgs) => Promise<EsbuildOnResolveResult>, onLoads: (args: EsbuildOnLoadArgs) => Promise<EsbuildOnLoadResult>): EsbuildPlugin | Promise<EsbuildPlugin>;
}
interface OnResolveCallback {
    (args: EsbuildOnResolveArgs): EsbuildOnResolveResult | null | undefined | Promise<EsbuildOnResolveResult | null | undefined>;
    pluginName?: string;
}
interface OnLoadCallback {
    (args: EsbuildOnLoadArgs): EsbuildOnLoadResult | null | undefined | Promise<EsbuildOnLoadResult | null | undefined>;
    pluginName?: string;
}
export interface PluginBuild {
    onResolve(options: EsbuildOnResolveOptions, callback: OnResolveCallback): void;
    onLoad(options: EsbuildOnLoadOptions, callback: OnLoadCallback): void;
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
    (config: UserConfig): Plugin;
    needConfig: boolean;
}
export declare function connectConfigHelper(callback: Function, args: string[]): ConnectConfigHelper;
declare type PendingPlguins = (ConnectConfigHelper | Plugin)[];
export declare function constructEsbuildPlugin(proxyPlugin: ProxyPlugin, plugins: PendingPlguins, config: UserConfig): EsbuildPlugin;
export {};
