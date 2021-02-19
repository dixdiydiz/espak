export interface GenerateIndexHtml {
    (html: string): string;
    _pluginName?: string;
}
interface nextChain {
    action: GenerateIndexHtml;
    next: nextChain | null | undefined;
}
interface firstChain extends nextChain {
    last: nextChain | firstChain;
}
export declare let generateHtmlChain: firstChain;
export declare function generateIndexHtmlHook(cb: GenerateIndexHtml): void;
export declare function clonePublicDir(publicdir: string): Promise<void>;
export {};
