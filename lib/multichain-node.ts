import {Chain, ChainOptions, defaultChainOptions, DrandNode, HealthCheckResponse} from "./index"
import CachingChain from "./caching-chain"

class MultiChainNode implements DrandNode {
    constructor(public baseUrl: string, private options: ChainOptions = defaultChainOptions) {
    }

    async chains(): Promise<Array<Chain>> {
        const response = await fetch(`${this.baseUrl}/chains`)
        const chains = await response.json()

        if (!Array.isArray(chains)) {
            throw Error(`Expected an array from the chains endpoint but got: ${chains}`)
        }
        return chains.map((chainHash: string) => new CachingChain(`${this.baseUrl}/${chainHash}`), this.options)
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

export default MultiChainNode