import { Chain, ChainInfo, ChainOptions } from './index';
import { HttpOptions } from './util';
declare class HttpChain implements Chain {
    baseUrl: string;
    private options;
    private httpOptions;
    constructor(baseUrl: string, options?: ChainOptions, httpOptions?: HttpOptions);
    info(): Promise<ChainInfo>;
}
declare class HttpCachingChain implements Chain {
    baseUrl: string;
    private options;
    private chain;
    private cachedInfo?;
    constructor(baseUrl: string, options?: ChainOptions);
    info(): Promise<ChainInfo>;
}
export { HttpChain };
export default HttpCachingChain;
