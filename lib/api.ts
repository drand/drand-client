import {sha256} from '@noble/hashes/sha2'
import {Buffer} from 'buffer'
import type {ApiVersion, ChainInfo, ChainOptions, RandomnessBeacon} from './index'

// the drand HTTP API comes in two flavours:
//   v1 - served by e.g. cloudflare relays, paths like `/public/{round}` and `/info`
//   v2 - served by the drand team's relays under `/v2/chains/{hash}/...`
// they differ in URL layout and in the wire format of `/info` and beacon responses.
// this module maps both onto the client's internal `ChainInfo`/`RandomnessBeacon` types.

export function apiVersionOf(options: Pick<ChainOptions, 'apiVersion'>): ApiVersion {
    return options.apiVersion ?? 'v1'
}

// the path segment used to fetch a beacon, relative to a chain's base URL
export function roundEndpoint(apiVersion: ApiVersion, round: number | 'latest'): string {
    const collection = apiVersion === 'v2' ? 'rounds' : 'public'
    return `${collection}/${round}`
}

// the v2 `/info` response renames several fields compared to v1
type V2ChainInfo = {
    public_key: string
    period: number
    genesis_time: number
    genesis_seed: string   // v1 `groupHash`
    chain_hash: string     // v1 `hash`
    scheme: string         // v1 `schemeID`
    beacon_id: string      // v1 `metadata.beaconID`
}

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
function isV2ChainInfo(info: any): info is V2ChainInfo {
    return !!info && typeof info === 'object' && typeof info.chain_hash === 'string'
}

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
export function normaliseChainInfo(info: any): ChainInfo {
    if (!isV2ChainInfo(info)) {
        return info as ChainInfo
    }
    return {
        public_key: info.public_key,
        period: info.period,
        genesis_time: info.genesis_time,
        hash: info.chain_hash,
        groupHash: info.genesis_seed,
        schemeID: info.scheme,
        metadata: {beaconID: info.beacon_id},
    }
}

// v2 beacon responses omit `randomness`, which is deterministically the sha256 of the
// (verified) signature. we derive it so beacons from both APIs share one internal shape.
// eslint-disable-next-line  @typescript-eslint/no-explicit-any
export function normaliseBeacon(beacon: any): RandomnessBeacon {
    if (!beacon || typeof beacon !== 'object' || typeof beacon.signature !== 'string') {
        return beacon as RandomnessBeacon
    }
    if (beacon.randomness) {
        return beacon as RandomnessBeacon
    }
    return {...beacon, randomness: randomnessFromSignature(beacon.signature)}
}

export function randomnessFromSignature(signature: string): string {
    return Buffer.from(sha256(Buffer.from(signature, 'hex'))).toString('hex')
}
