import CachingChain from './caching-chain'
import HttpChainClient from './http-chain-client'
import MultiChainClient from './multichain-client'
import MultiChainNode from './multichain-node'
import {roundAt, roundTime, sleep} from './util'

// functionality for a given drand node
export interface DrandNode {
    chains(): Promise<Array<Chain>>
    health(): Promise<HealthCheckResponse>
}

// functionality for a given chain hosted by a node
export interface Chain {
    baseUrl: string

    info(): Promise<ChainInfo>
}

export type ChainOptions = {
    // setting this to true will skip validation of beacons signatures (not recommended)
    disableBeaconVerification: boolean

    // setting this will add a query param to requests to stop it getting a cached version
    noCache: boolean

    // adding these params will verify that the chain info from the requested chain matches them, otherwise an error will be thrown
    // leaving them out assumes that you are sure the `baseUrl` you are using for the chain client is the correct chain
    chainVerificationParams?: ChainVerificationParams
}

export const defaultChainOptions: ChainOptions = {
    disableBeaconVerification: false,
    noCache: false,
}

export type ChainVerificationParams = {
    chainHash: string
    publicKey: string
}

export type HealthCheckResponse = {
    // the http status code of the node
    status: number
    // the current round this node has caught up to.  -1 when the service cannot be contacted
    current: number
    // the expected current round.  -1 when the service cannot be contacted
    expected: number
}

// functionality for fetching individual beacons for a given `Chain`
export interface ChainClient {
    latest(chain: Chain): Promise<RandomnessBeacon>

    get(chain: Chain, roundNumber: number): Promise<RandomnessBeacon>
}

// fetch a beacon for a given `roundNumber` or get the latest beacon by omitting the `roundNumber`
export async function fetchBeacon(chain: Chain, client: ChainClient, roundNumber?: number): Promise<RandomnessBeacon> {
    if (!roundNumber) {
        return client.latest(chain)
    }
    return client.get(chain, roundNumber)
}

// fetch the most recent beacon to have been emitted at a given `time` in epoch ms
export async function fetchBeaconByTime(chain: Chain, client: ChainClient, time: number): Promise<RandomnessBeacon> {
    const info = await chain.info()
    if (time < info.genesis_time) {
        throw Error('Cannot request a beacon before the genesis time')
    }
    const roundNumber = roundAt(time, info)
    return fetchBeacon(chain, client, roundNumber)
}

// get an async generator emitting beacons from the latest round onwards
export async function* watch(chain: Chain, client: ChainClient, abortController: AbortController): AsyncGenerator<RandomnessBeacon> {
    while (!abortController.signal.aborted) {
        const info = await chain.info()
        const beacon = await client.latest(chain)
        yield beacon

        const now = Date.now()
        const nextRoundTime = roundTime(info, beacon.round + 1)

        await sleep(nextRoundTime - now)
    }
}

export type ChainInfo = {
    public_key: string
    period: number
    genesis_time: number
    hash: string
    groupHash: string
    schemeID: string
    metadata: {
        beaconID: string
    }
}

export type RandomnessBeacon = ChainedBeacon | UnchainedBeacon
export type ChainedBeacon = {
    round: number
    randomness: string
    signature: string
    previous_signature: string
}

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
export function isChainedBeacon(value: any, info: ChainInfo): value is ChainedBeacon {
    return info.schemeID === 'pedersen-bls-chained' &&
        !!value.previous_signature &&
        !!value.randomness &&
        !!value.signature &&
        value.round > 0
}

export type UnchainedBeacon = {
    round: number
    randomness: string
    signature: string
}

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
export function isUnchainedBeacon(value: any, info: ChainInfo): value is UnchainedBeacon {
    return info.schemeID === 'pedersen-bls-unchained' &&
        !!value.randomness &&
        !!value.signature &&
        value.previous_signature === undefined &&
        value.round > 0
}

// exports some default implementation of the above interfaces and other utility functions that could be used with them
export {HttpChainClient, CachingChain, MultiChainNode, MultiChainClient, roundAt, roundTime}
