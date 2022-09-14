import {Chain, ChainClient, ChainOptions, defaultChainOptions, RandomnessBeacon} from './index'
import {jsonOrError} from './util'

class HttpChainClient implements ChainClient {

    constructor(private someChain: Chain, public options: ChainOptions = defaultChainOptions) {
    }

    async get(roundNumber: number): Promise<RandomnessBeacon> {
        const url = withCachingParams(`${this.someChain.baseUrl}/public/${roundNumber}`, this.options)
        return await jsonOrError(url)
    }

    async latest(): Promise<RandomnessBeacon> {
        const url = withCachingParams(`${this.someChain.baseUrl}/public/latest`, this.options)
        return await jsonOrError(url)
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
