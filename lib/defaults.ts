import {ChainInfo, defaultChainOptions} from './index';
import HttpChainClient from './http-chain-client';
import HttpCachingChain from './http-caching-chain';

export const DEFAULT_CHAIN_URL = 'https://api.drand.sh'

export const DEFAULT_CHAIN_INFO = {
    public_key: '868f005eb8e6e4ca0a47c8a77ceaa5309a47978a7c71bc5cce96366b5d7a569937c529eeda66c7293784a9402801af31',
    period: 30,
    genesis_time: 1595431050,
    hash: '8990e7a9aaed2ffed73dbd7092123d6f289930540d7651336225dc172e51b2ce',
    groupHash: '176f93498eac9ca337150b46d21dd58673ea4e3581185f869672e59fa4cb390a',
    schemeID: 'pedersen-bls-chained',
    metadata: {
        'beaconID': 'default'
    }
}
export const QUICKNET_CHAIN_URL = 'https://api.drand.sh/52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971'

export const QUICKNET_CHAIN_INFO = {
    public_key: '83cf0f2896adee7eb8b5f01fcad3912212c437e0073e911fb90022d3e760183c8c4b450b6a0a6c3ac6a5776a2d1064510d1fec758c921cc22b0e17e63aaf4bcb5ed66304de9cf809bd274ca73bab4af5a6e9c76a4bc09e76eae8991ef5ece45a',
    period: 3,
    genesis_time: 1692803367,
    hash: '52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971',
    groupHash: 'f477d5c89f21a17c863a7f937c6a6d15859414d2be09cd448d4279af331c5d3e',
    schemeID: 'bls-unchained-g1-rfc9380',
    metadata: {
        beaconID: 'quicknet'
    }
}

export const TESTNET_DEFAULT_CHAIN_URL = 'https://pl-us.testnet.drand.sh'
export const TESTNET_DEFAULT_CHAIN_INFO: ChainInfo = {
    public_key: '922a2e93828ff83345bae533f5172669a26c02dc76d6bf59c80892e12ab1455c229211886f35bb56af6d5bea981024df',
    period: 25,
    genesis_time: 1590445175,
    hash: '84b2234fb34e835dccd048255d7ad3194b81af7d978c3bf157e3469592ae4e02',
    groupHash: '4dd408e5fdff9323c76a9b6f087ba8fdc5a6da907bd9217d9d10f2287d081957',
    schemeID: 'pedersen-bls-chained',
    metadata: {
        beaconID: 'default'
    }
}
export const TESTNET_QUICKNET_CHAIN_URL = 'https://pl-us.testnet.drand.sh/cc9c398442737cbd141526600919edd69f1d6f9b4adb67e4d912fbc64341a9a5'
export const TESTNET_QUICKNET_CHAIN_INFO: ChainInfo = {
    public_key: 'b15b65b46fb29104f6a4b5d1e11a8da6344463973d423661bb0804846a0ecd1ef93c25057f1c0baab2ac53e56c662b66072f6d84ee791a3382bfb055afab1e6a375538d8ffc451104ac971d2dc9b168e2d3246b0be2015969cbaac298f6502da',
    period: 3,
    genesis_time: 1689232296,
    hash: 'cc9c398442737cbd141526600919edd69f1d6f9b4adb67e4d912fbc64341a9a5',
    groupHash: '40d49d910472d4adb1d67f65db8332f11b4284eecf05c05c5eacd5eef7d40e2d',
    schemeID: 'bls-unchained-g1-rfc9380',
    metadata: {
        beaconID: 'quicknet-t'
    }
}
export function defaultClient(): HttpChainClient {
    const opts = {
        ...defaultChainOptions,
        chainVerificationParams: {
            chainHash: DEFAULT_CHAIN_INFO.hash,
            publicKey: DEFAULT_CHAIN_INFO.public_key
        }
    }
    const chain = new HttpCachingChain(DEFAULT_CHAIN_URL, opts)
    return new HttpChainClient(chain, opts)
}

export function quicknetClient(): HttpChainClient {
    const opts = {
        ...defaultChainOptions,
        chainVerificationParams: {
            chainHash: QUICKNET_CHAIN_INFO.hash,
            publicKey: QUICKNET_CHAIN_INFO.public_key
        }
    }
    const chain = new HttpCachingChain(QUICKNET_CHAIN_URL, opts)
    return new HttpChainClient(chain, opts)
}

export function testnetDefaultClient(): HttpChainClient {
    const opts = {
        ...defaultChainOptions,
        chainVerificationParams: {
            chainHash: TESTNET_DEFAULT_CHAIN_INFO.hash,
            publicKey: TESTNET_DEFAULT_CHAIN_INFO.public_key
        }
    }
    const chain = new HttpCachingChain(TESTNET_DEFAULT_CHAIN_URL, opts)
    return new HttpChainClient(chain, opts)
}

export function testnetQuicknetClient(): HttpChainClient {
    const opts = {
        ...defaultChainOptions,
        chainVerificationParams: {
            chainHash: TESTNET_QUICKNET_CHAIN_INFO.hash,
            publicKey: TESTNET_QUICKNET_CHAIN_INFO.public_key
        }
    }
    const chain = new HttpCachingChain(TESTNET_QUICKNET_CHAIN_URL, opts)
    return new HttpChainClient(chain, opts)
}