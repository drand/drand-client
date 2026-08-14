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

// the `/info` response for the default chain as served by the v2 API - it renames several
// fields relative to v1 and should normalise to `validTestChainInfo` above
export const validV2ChainInfoResponse = {
    public_key: '868f005eb8e6e4ca0a47c8a77ceaa5309a47978a7c71bc5cce96366b5d7a569937c529eeda66c7293784a9402801af31',
    period: 30,
    genesis_time: 1595431050,
    genesis_seed: '176f93498eac9ca337150b46d21dd58673ea4e3581185f869672e59fa4cb390a',
    chain_hash: '8990e7a9aaed2ffed73dbd7092123d6f289930540d7651336225dc172e51b2ce',
    scheme: 'pedersen-bls-chained',
    beacon_id: 'default'
}

// round 1000 of the default chain as served by the v2 API - beacons omit `randomness`
export const validV2BeaconResponse = {
    round: 1000,
    signature: '99bf96de133c3d3937293cfca10c8152b18ab2d034ccecf115658db324d2edc00a16a2044cd04a8a38e2a307e5ecff3511315be8d282079faf24098f283e0ed2c199663b334d2e84c55c032fe469b212c5c2087ebb83a5b25155c3283f5b79ac',
    previous_signature: 'af0d93299a363735fe847f5ea241442c65843dc1bd3a7b79646b3b10072e908bf034d35cd69d378e3341f139100cd4cd03030399864ef8803a5a4f5e64fccc20bbae36d1ca22a6ddc43d2630c41105e90598fab11e5c7456df3925d4b577b113'
}

// the same round 1000, with the `randomness` drand derives from the signature (sha256(signature))
export const validV2BeaconNormalised: RandomnessBeacon = {
    ...validV2BeaconResponse,
    randomness: 'a40d3e0e7e3c71f28b7da2fd339f47f0bcf10910309f5253d7c323ec8cea3212'
}
