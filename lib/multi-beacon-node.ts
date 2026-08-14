import {Chain, ChainOptions, defaultChainOptions, DrandNode, HealthCheckResponse} from './index'
import HttpCachingChain from './http-caching-chain'
import {jsonOrError} from './util'
import {apiVersionOf} from './api'

class MultiBeaconNode implements DrandNode {
    constructor(public baseUrl: string, private options: ChainOptions = defaultChainOptions) {
    }

    async chains(): Promise<Array<Chain>> {
        const v2 = apiVersionOf(this.options) === 'v2'
        const chains = await jsonOrError(`${this.baseUrl}${v2 ? '/v2/chains' : '/chains'}`)
        if (!Array.isArray(chains)) {
            throw Error(`Expected an array from the chains endpoint but got: ${chains}`)
        }
        return chains.map((chainHash: string) => {
            const chainUrl = v2 ? `${this.baseUrl}/v2/chains/${chainHash}` : `${this.baseUrl}/${chainHash}`
            return new HttpCachingChain(chainUrl, this.options)
        })
    }

    async health(): Promise<HealthCheckResponse> {
        const response = await fetch(`${this.baseUrl}/health`)
        if (!response.ok) {
            return {
                status: response.status,
                current: -1,
                expected: -1
            }
        }

        const json = await response.json()
        return {
            status: response.status,
            current: json.current ?? -1,
            expected: json.expected ?? -1,
        }
    }
}

export default MultiBeaconNode
