import { Chain, ChainClient, ChainOptions, RandomnessBeacon } from './index';
import { HttpOptions } from './util';
declare class HttpChainClient implements ChainClient {
    private someChain;
    options: ChainOptions;
    httpOptions: HttpOptions;
    constructor(someChain: Chain, options?: ChainOptions, httpOptions?: HttpOptions);
    get(roundNumber: number): Promise<RandomnessBeacon>;
    latest(): Promise<RandomnessBeacon>;
    chain(): Chain;
}
export default HttpChainClient;
