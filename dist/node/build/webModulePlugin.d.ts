import { Plugin } from '../plugin-system/agency';
declare const webModulePlugin: (external: string[], cjsModule?: Record<string, string>) => Promise<Plugin>;
export default webModulePlugin;
