import {Chain, ChainClient, ChainOptions, defaultChainOptions, RandomnessBeacon} from './index'
import {jsonOrError} from './util'
import {verifyBeacon} from './beacon-verification'

class HttpChainClient implements ChainClient {

    constructor(private options: ChainOptions = defaultChainOptions) {
    }

    async get(chain: Chain, roundNumber: number): Promise<RandomnessBeacon> {
        if (roundNumber < 1) {
            throw Error('Cannot request lower than round number 1')
        }

        return this.fetchRound(chain, `${roundNumber}`)
    }

    async latest(chain: Chain): Promise<RandomnessBeacon> {
        return this.fetchRound(chain, 'latest')
    }

    async fetchRound(chain: Chain, tag: string): Promise<RandomnessBeacon> {
        const info = await chain.info()
        const url = withCachingParams(`${chain.baseUrl}/public/${tag}`, this.options)
        const beacon = await jsonOrError(url)
        if (this.options.disableBeaconVerification) {
            return beacon
        }
        if (!await verifyBeacon(info, beacon)) {
            throw Error('The beacon retrieved was not valid!')
        }

        return beacon
    }
}

function withCachingParams(url: string, config: ChainOptions): string {
    if (config.noCache) {
        return `${url}?${Date.now()}`
    }
    return url
}

export default HttpChainClient
