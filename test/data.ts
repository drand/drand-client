import {Chain, ChainInfo, RandomnessBeacon} from '../lib'

// a chain info taken from the mainnet
export const validTestChainInfo: ChainInfo = {
    public_key: '868f005eb8e6e4ca0a47c8a77ceaa5309a47978a7c71bc5cce96366b5d7a569937c529eeda66c7293784a9402801af31',
    period: 30,
    genesis_time: 1595431050,
    hash: '8990e7a9aaed2ffed73dbd7092123d6f289930540d7651336225dc172e51b2ce',
    groupHash: '176f93498eac9ca337150b46d21dd58673ea4e3581185f869672e59fa4cb390a',
    schemeID: 'pedersen-bls-chained',
    metadata: {
        beaconID: 'default'
    }
}

// a chain that resolves the info immediately
export const testChain: Chain = {
    baseUrl: 'https://example.com',
    info: () => Promise.resolve(validTestChainInfo)
}

// the first round of randomness emitted by the chain on mainnet (that corresponds to the `validTestChainInfo` above)
export const validTestBeacon: RandomnessBeacon = {
    round: 1,
    randomness: '101297f1ca7dc44ef6088d94ad5fb7ba03455dc33d53ddb412bbc4564ed986ec',
    signature: '8d61d9100567de44682506aea1a7a6fa6e5491cd27a0a0ed349ef6910ac5ac20ff7bc3e09d7c046566c9f7f3c6f3b10104990e7cb424998203d8f7de586fb7fa5f60045417a432684f85093b06ca91c769f0e7ca19268375e659c2a2352b4655',
    previous_signature: '176f93498eac9ca337150b46d21dd58673ea4e3581185f869672e59fa4cb390a'
}
