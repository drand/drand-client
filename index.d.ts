import { AbortSignal } from "abort-controller"

type RandomnessBeacon = {
    round: number
    randomness: string
    signature: string
    previous_signature: string
}

type NodeInfo = {
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

type ClientOptions = {
    insecure: boolean
    disableBeaconVerification: boolean
    chainHash: string
    chainInfo: string
    cacheSize: number
    watcher: Watcher
} & WatcherOptions

type WatcherOptions = {
    signal: AbortSignal
}

export interface Watcher {
    watch(options: WatcherOptions): Promise<IterableIterator<RandomnessBeacon>>
    close(): Promise<void>
}

export class HTTP {
    static forURLs(urls: Array<string>, chainHash: string): Promise<Array<HTTP>>
    static info(url: string, chainHash: string, options: ClientOptions): Promise<NodeInfo>

    get(): Promise<RandomnessBeacon>
    info(): Promise<NodeInfo>
    close(): Promise<void>
    roundAt(time: number): number
}

export class Client {
    static wrap(clients: Array<Client>, options: ClientOptions): Client
}
