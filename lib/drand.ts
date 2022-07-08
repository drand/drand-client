import HTTP, {ClientOptions, Watcher} from './http'
import VerifyingClient from './verifying-client'
import OptimizingClient from './optimizing-client'

export type DrandOptions = Partial<{
    chainHash: string
    insecure: boolean
    disableBeaconVerification: boolean
    chainInfo: ChainInfo
    cacheSize: number
    watcher: Watcher
}>

export interface NetworkClient {
    get(round?: number, options?: ClientOptions): Promise<RandomnessBeacon>
    info(): Promise<ChainInfo>
    roundAt(time: number): number
    close(): Promise<void>
    watch(options: ClientOptions): AsyncGenerator<RandomnessBeacon>
}

class Client {
    static async wrap(clients: Array<NetworkClient> = [], options: DrandOptions): Promise<NetworkClient> {
        const cfg = {...options, cacheSize: options.cacheSize || 32}

        if (!cfg.insecure && cfg.chainHash == null && cfg.chainInfo == null) {
            throw new Error('no root of trust specified')
        }
        if (clients.length === 0 && cfg.watcher == null) {
            throw new Error('no points of contact specified')
        }

        // TODO: watcher

        if (!cfg.disableBeaconVerification) {
            clients = clients.map(c => new VerifyingClient(c))
        }

        const optimisingClient = new OptimizingClient(clients)
        await optimisingClient.start()

        // TODO: caching
        // TODO: aggregating

        return optimisingClient
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

export type RandomnessBeacon = {
    round: number
    randomness: string
    signature: string
    previous_signature: string
}

export default Client
export { HTTP }