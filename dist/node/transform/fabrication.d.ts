import { startBuildServe } from './wrapEsbuild';
import { BuildOptions, Plugin } from 'esbuild';
import { TempDist } from '../index';
export interface ResolveOptions {
    basedir?: string;
    extensions?: string[];
    includeCoreModules?: boolean;
}
export declare function resolveModule(pathSource: string, options: ResolveOptions): string;
export declare type EspakPlugin = (dist: TempDist, service: typeof startBuildServe) => Plugin | Promise<Plugin>;
export declare function createPlugins(plugins: EspakPlugin[]): Promise<Plugin[]>;
export declare function customModuleHandler(src: string[], option: BuildOptions): Promise<void>;
