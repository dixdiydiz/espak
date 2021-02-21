export interface GenerateIndexHtml {
    (html: string): string;
    _pluginName: string;
}
interface NextChain {
    action: GenerateIndexHtml;
    next: NextChain | null | undefined;
}
interface FirstChain extends NextChain {
    last: NextChain | FirstChain;
}
export declare let generateHtmlChain: FirstChain;
export declare function generateIndexHtmlHook(cb: GenerateIndexHtml): void;
export declare function overWriteHtml(publicDir: string): Promise<void>;
export {};
