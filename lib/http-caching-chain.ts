import {Chain, ChainInfo, ChainOptions, ChainVerificationParams, defaultChainOptions} from './index'
import {HttpOptions, jsonOrError} from './util'

class HttpChain implements Chain {
    constructor(
        public baseUrl: string,
        private options: ChainOptions = defaultChainOptions,
        private httpOptions: HttpOptions = {}) {
    }

    async info(): Promise<ChainInfo> {
        const chainInfo = await jsonOrError(`${this.baseUrl}/info`, this.httpOptions)
        if (!!this.options.chainVerificationParams && !isValidInfo(chainInfo, this.options.chainVerificationParams)) {
            throw Error(`The chain info retrieved from ${this.baseUrl} did not match the verification params!`)
        }
        return chainInfo
    }
}

function isValidInfo(chainInfo: ChainInfo, validParams: ChainVerificationParams): boolean {
    return chainInfo.hash === validParams.chainHash && chainInfo.public_key === validParams.publicKey
}

class HttpCachingChain implements Chain {
    private chain: Chain
    private cachedInfo?: ChainInfo

    constructor(public baseUrl: string, private options: ChainOptions = defaultChainOptions) {
        this.chain = new HttpChain(baseUrl, options)
    }

    async info(): Promise<ChainInfo> {
        if (!this.cachedInfo) {
            this.cachedInfo = await this.chain.info()
        }
        return this.cachedInfo
    }
}

export {HttpChain}
export default HttpCachingChain
