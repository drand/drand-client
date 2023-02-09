import {Chain, ChainClient, ChainOptions, defaultChainOptions, RandomnessBeacon} from './index'
import {defaultHttpOptions, HttpOptions, jsonOrError} from './util'

class HttpChainClient implements ChainClient {

    constructor(
        private someChain: Chain,
        public options: ChainOptions = defaultChainOptions,
        public httpOptions: HttpOptions = defaultHttpOptions) {
    }

    async get(roundNumber: number): Promise<RandomnessBeacon> {
        const url = withCachingParams(`${this.someChain.baseUrl}/public/${roundNumber}`, this.options)
        return await jsonOrError(url, this.httpOptions)
    }

    async latest(): Promise<RandomnessBeacon> {
        const url = withCachingParams(`${this.someChain.baseUrl}/public/latest`, this.options)
        return await jsonOrError(url, this.httpOptions)
    }

    chain(): Chain {
        return this.someChain
    }
}

function withCachingParams(url: string, config: ChainOptions): string {
    if (config.noCache) {
        return `${url}?${Date.now()}`
    }
    return url
}

export default HttpChainClient
