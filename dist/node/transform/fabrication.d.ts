import { UserConfig } from '../config';
import { startBuildServe } from './wrapEsbuild';
import { BuildOptions, Plugin } from 'esbuild';
import { TempDist } from '../index';
export interface ResolveOptions {
    basedir?: string;
    extensions?: string[];
    includeCoreModules?: boolean;
}
export declare function resolveModule(pathSource: string, options: ResolveOptions): string;
export interface BuildUtil {
    buildServe: typeof startBuildServe;
    config: UserConfig;
    dist: TempDist;
}
export declare type EspakPlugin = (util: BuildUtil, arg?: unknown) => Plugin | Promise<Plugin>;
export declare function createPlugins(plugins: EspakPlugin[], config: UserConfig, ...args: any[]): Promise<Plugin[]>;
export declare function customModuleHandler(src: string[], option: BuildOptions): Promise<void>;
