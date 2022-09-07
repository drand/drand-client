import {Chain, ChainClient, ChainOptions, defaultChainOptions, RandomnessBeacon} from './index'
import {jsonOrError} from './util'
import {verifyBeacon} from './beacon-verification'

class HttpChainClient implements ChainClient {

    constructor(private someChain: Chain, private options: ChainOptions = defaultChainOptions) {
    }

    async get(roundNumber: number): Promise<RandomnessBeacon> {
        if (roundNumber < 1) {
            throw Error('Cannot request lower than round number 1')
        }

        return this.fetchRound(`${roundNumber}`)
    }

    async latest(): Promise<RandomnessBeacon> {
        return this.fetchRound('latest')
    }

    async fetchRound(tag: string): Promise<RandomnessBeacon> {
        const info = await this.someChain.info()
        const url = withCachingParams(`${this.someChain.baseUrl}/public/${tag}`, this.options)
        const beacon = await jsonOrError(url)
        if (this.options.disableBeaconVerification) {
            return beacon
        }
        if (!await verifyBeacon(info, beacon)) {
            throw Error('The beacon retrieved was not valid!')
        }

        return beacon
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
