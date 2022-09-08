import HttpCachingChain from './http-caching-chain'
import HttpChainClient from './http-chain-client'
import FastestNodeClient from './fastest-node-client'
import MultiBeaconNode from './multi-beacon-node'
import {roundAt, roundTime, sleep} from './util'
import {verifyBeacon} from './beacon-verification'

// functionality for inspecting a drand node
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

    // setting this will add a query param to requests to stop providers returning a cached version
    noCache: boolean

    // adding these params will verify that the chain info from the requested chain matches them, otherwise an error will be thrown.
    // Leaving them out assumes that you are sure the `baseUrl` you are using for the chain client is the correct chain
    chainVerificationParams?: ChainVerificationParams
}

export const defaultChainOptions: ChainOptions = {
    disableBeaconVerification: false,
    noCache: false,
}

// these should correspond to `hash` and `public_key` in the `ChainInfo` below
export type ChainVerificationParams = {
    chainHash: string
    publicKey: string
}

// this is aggregation of information returned by the `/health` endpoint of a node
export type HealthCheckResponse = {
    // the http status code returned from the node's healthcheck
    status: number
    // the current round this node has caught up to. -1 when the service cannot be contacted
    current: number
    // the expected current round. -1 when the service cannot be contacted
    expected: number
}

// functionality for fetching individual beacons for a given `Chain`
// you can implement this yourself to support protocols other than HTTP
export interface ChainClient {
    options: ChainOptions

    latest(): Promise<RandomnessBeacon>

    get(roundNumber: number): Promise<RandomnessBeacon>

    chain(): Chain
}

// fetch a beacon for a given `roundNumber` or get the latest beacon by omitting the `roundNumber`
export async function fetchBeacon(client: ChainClient, roundNumber?: number): Promise<RandomnessBeacon> {
    let beacon = null

    if (!roundNumber) {
        beacon = await client.latest()
    } else if (roundNumber < 1) {
        throw Error('Cannot request lower than round number 1')
    } else {
        beacon = await client.get(roundNumber)
    }

    return validatedBeacon(client, beacon)
}

// fetch the most recent beacon to have been emitted at a given `time` in epoch ms
export async function fetchBeaconByTime(client: ChainClient, time: number): Promise<RandomnessBeacon> {
    const info = await client.chain().info()
    const roundNumber = roundAt(time, info)
    return fetchBeacon(client, roundNumber)
}

// an async generator emitting beacons from the latest round onwards
export async function* watch(client: ChainClient, abortController: AbortController): AsyncGenerator<RandomnessBeacon> {
    while (!abortController.signal.aborted) {
        const info = await client.chain().info()
        const beacon = await client.latest()
        yield validatedBeacon(client, beacon)

        const nextRoundTime = roundTime(info, beacon.round + 1)
        const now = Date.now()

        await sleep(nextRoundTime - now)
    }
}

// internal function for validating a beacon if validation has not been disabled in the client options
async function validatedBeacon(client: ChainClient, beacon: RandomnessBeacon): Promise<RandomnessBeacon> {
    if (client.options.disableBeaconVerification) {
        return beacon
    }
    const info = await client.chain().info()
    if (!await verifyBeacon(info, beacon)) {
        throw Error('The beacon retrieved was not valid!')
    }

    return beacon
}

// `ChainInfo` is returned by a node's `/info` endpoint
export type ChainInfo = {
    public_key: string    // base64 encoded ed25519 public key
    period: number        // how often the network emits randomness (in seconds)
    genesis_time: number  // the time of the round 0 of the network (in epoch seconds)
    hash: string          // the hash identifying this specific chain of beacons
    groupHash: string     // a hash of the group file containing details of all the nodes participating in the network
    schemeID: string      // the version/format of cryptography
    metadata: {
        beaconID: string  // the ID of the beacon chain this `ChainInfo` corresponds to
    }
}

// currently drand supports chained and unchained randomness - read more here: https://drand.love/docs/cryptography/#randomness
export type RandomnessBeacon = ChainedBeacon | UnchainedBeacon

export type ChainedBeacon = {
    round: number
    randomness: string
    signature: string
    previous_signature: string
}

export type UnchainedBeacon = {
    round: number
    randomness: string
    signature: string
}

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
export function isChainedBeacon(value: any, info: ChainInfo): value is ChainedBeacon {
    return info.schemeID === 'pedersen-bls-chained' &&
        !!value.previous_signature &&
        !!value.randomness &&
        !!value.signature &&
        value.round > 0
}


// eslint-disable-next-line  @typescript-eslint/no-explicit-any
export function isUnchainedBeacon(value: any, info: ChainInfo): value is UnchainedBeacon {
    return info.schemeID === 'pedersen-bls-unchained' &&
        !!value.randomness &&
        !!value.signature &&
        value.previous_signature === undefined &&
        value.round > 0
}

// exports some default implementations of the above interfaces and other utility functions that could be used with them
export {HttpChainClient, HttpCachingChain, MultiBeaconNode, FastestNodeClient, roundAt, roundTime}
