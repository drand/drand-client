import {Chain, ChainInfo, ChainOptions, ChainVerificationParams, defaultChainOptions} from "./index"
import {jsonOrError} from "./util"

class CachingChain implements Chain {

    private cachedInfo?: ChainInfo

    constructor(public baseUrl: string, private options: ChainOptions = defaultChainOptions) {
    }

    async info(): Promise<ChainInfo> {
        if (this.cachedInfo) {
            return this.cachedInfo
        }
        const chainInfo = await jsonOrError(`${this.baseUrl}/info`)
        if (!!this.options.chainVerificationParams && !isValidInfo(chainInfo, this.options.chainVerificationParams)) {
            throw Error(`The chain info retrieved from ${this.baseUrl} did not match the verification params!`)
        }
        this.cachedInfo = chainInfo
        return chainInfo
    }
}

function isValidInfo(chainInfo: ChainInfo, validParams: ChainVerificationParams): boolean {
    return chainInfo.hash === validParams.chainHash && chainInfo.public_key === validParams.publicKey
}

export default CachingChain