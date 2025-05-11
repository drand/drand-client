import {Chain, ChainClient, ChainOptions, defaultChainOptions, RandomnessBeacon} from './index'
import {defaultHttpOptions, HttpOptions, jsonOrError} from './util'

class HttpChainClient implements ChainClient {
    private readonly baseUrl: string;

    constructor(
        private someChain: Chain,
        public options: ChainOptions = defaultChainOptions,
        public httpOptions: HttpOptions = {
            ...defaultHttpOptions,
            timeout: 10000, // 10 second timeout
        }
    ) {
        if (!someChain || !someChain.baseUrl) {
            throw new Error('Invalid chain: Missing base URL');
        }
        this.baseUrl = someChain.baseUrl.replace(/\/+$/, ''); // Remove trailing slashes
    }

    async get(roundNumber: number): Promise<RandomnessBeacon> {
        if (!Number.isInteger(roundNumber) || roundNumber < 1) {
            throw new Error('Invalid round number: Must be a positive integer');
        }

        try {
            const url = withCachingParams(`${this.baseUrl}/public/${roundNumber}`, this.options);
            return await jsonOrError(url, this.httpOptions);
        } catch (error) {
            throw new Error(`Failed to fetch round ${roundNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async latest(): Promise<RandomnessBeacon> {
        try {
            const url = withCachingParams(`${this.baseUrl}/public/latest`, this.options);
            return await jsonOrError(url, this.httpOptions);
        } catch (error) {
            throw new Error(`Failed to fetch latest beacon: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    chain(): Chain {
        return this.someChain;
    }
}

function withCachingParams(url: string, config: ChainOptions): string {
    if (!url) {
        throw new Error('Invalid URL: URL cannot be empty');
    }
    
    if (config.noCache) {
        const timestamp = Date.now();
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}nocache=${timestamp}`;
    }
    return url;
}

export default HttpChainClient
