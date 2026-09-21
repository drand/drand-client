import {Chain, ChainClient, ChainOptions, defaultChainOptions, RandomnessBeacon} from './index'
import {defaultHttpOptions, HttpOptions, jsonOrError} from './util'
import {apiVersionOf, normaliseBeacon, roundEndpoint} from './api'

class HttpChainClient implements ChainClient {

    constructor(
        private someChain: Chain,
        public options: ChainOptions = defaultChainOptions,
        public httpOptions: HttpOptions = defaultHttpOptions) {
    }

    async get(roundNumber: number): Promise<RandomnessBeacon> {
        const endpoint = roundEndpoint(apiVersionOf(this.options), roundNumber)
        const url = withCachingParams(`${this.someChain.baseUrl}/${endpoint}`, this.options)
        return normaliseBeacon(await jsonOrError(url, this.httpOptions))
    }

    async latest(): Promise<RandomnessBeacon> {
        const endpoint = roundEndpoint(apiVersionOf(this.options), 'latest')
        const url = withCachingParams(`${this.someChain.baseUrl}/${endpoint}`, this.options)
        return normaliseBeacon(await jsonOrError(url, this.httpOptions))
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
