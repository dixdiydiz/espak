import { Plugin } from '../plugin-system/agency';
declare const webModulePlugin: (external: string[]) => Promise<Plugin>;
export default webModulePlugin;
