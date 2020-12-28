import { BuildOptions, BuildResult } from 'esbuild';
export declare function buildConfig(profile: string, prefix: string): Promise<object>;
export declare function singleBuild(option: BuildOptions): Promise<BuildResult>;
export declare function startBuildServe(options: BuildOptions[]): Promise<BuildResult[]>;
