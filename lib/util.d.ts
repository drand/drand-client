import { ChainInfo } from './index';
export declare function sleep(timeMs: number): Promise<void>;
export declare function roundAt(time: number, chain: ChainInfo): number;
export declare function roundTime(chain: ChainInfo, round: number): number;
export type HttpOptions = {
    userAgent?: string;
    headers?: Record<string, string>;
};
export declare const defaultHttpOptions: HttpOptions;
export declare function jsonOrError(url: string, options?: HttpOptions): Promise<any>;
export declare function retryOnError<T>(fn: () => Promise<T>, times: number): Promise<T>;
