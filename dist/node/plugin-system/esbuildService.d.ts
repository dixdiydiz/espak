import esbuild, { BuildOptions } from 'esbuild';
export declare function buildServe(options: BuildOptions | BuildOptions[]): Promise<esbuild.BuildResult[]>;
