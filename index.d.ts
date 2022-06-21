import { AbortSignal } from "abort-controller"
export type RandomnessBeacon = {
    round: number
    randomness: string
    signature: string
    previous_signature: string
}

export type NodeInfo = {
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

export type ClientOptions = {
    chainHash: string
    insecure?: boolean
    disableBeaconVerification?: boolean
    chainInfo?: string
    cacheSize?: number
    watcher?: Watcher
} & WatcherOptions

export type WatcherOptions = {
    signal?: AbortSignal
}

export interface Watcher {
    watch(options: WatcherOptions): Promise<IterableIterator<RandomnessBeacon>>
    close(): Promise<void>
}

export class HTTP {
    static forURLs(urls: Array<string>, chainHash: string): Promise<Array<HTTP>>
}

export class Client {
    static wrap(clients: Array<HTTP>, options: ClientOptions): Client
    start(): Promise<void>
    get(round?: number, options?: ClientOptions): Promise<RandomnessBeacon>
    info(): Promise<NodeInfo>
    close(): Promise<void>
    roundAt(time: number): number
}

export default Client