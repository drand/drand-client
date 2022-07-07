import {ChainInfo, DrandOptions, NetworkClient, RandomnessBeacon} from "./drand";
import Chain from "./chain";
import {controllerWithParent} from "./abort";
import PollingWatcher from "./polling-watcher";

export default class HTTP {
    private readonly watcher: Watcher
    private controllers: Array<any>

    constructor(
        private readonly url: string,
        private readonly chainInfo: ChainInfo,
        private readonly options: DrandOptions = {}) {
        this.watcher = new PollingWatcher(this, chainInfo)
        this.controllers = []
    }

    async get(round: number = 0, options: ClientOptions) {
        options = options || {}

        const controller = controllerWithParent(options.signal)
        this.controllers.push(controller)

        try {
            const url = `${this.url}/public/${round || 'latest'}${options.noCache ? '?' + Date.now() : ''}`
            const res = await fetch(url, {signal: controller.signal})
            if (!res.ok) throw new Error(`unexpected HTTP status ${res.status} for URL ${url}`)
            return res.json()
        } finally {
            this.controllers = this.controllers.filter(c => c !== controller)
            controller.abort()
        }
    }

    async info () {
        return this.chainInfo
    }

    async * watch (options: ClientOptions): AsyncGenerator<RandomnessBeacon> {
        yield * await this.watcher.watch(options)
    }

    roundAt (time: number) {
        return Chain.roundAt(time, this.chainInfo.genesis_time * 1000, this.chainInfo.period * 1000)
    }

    async close () {
        this.controllers.forEach(c => c.abort())
        this.controllers = []
        await this.watcher.close()
    }

    static async info(url: string, chainHash: string, options: ClientOptions = {}) {
        const res = await fetch(`${url}/info${options.noCache ? '?' + Date.now() : ''}`, { signal: options.signal })
        if (!res.ok) throw new Error(`unexpected HTTP status ${res.status} for URL ${url}/info`)

        const info = await res.json()
        if (chainHash && chainHash !== info.hash) {
            throw new Error(`${url} does not advertise the expected drand group (${info.hash} vs ${chainHash})`)
        }
        return info
    }
    static async forURLs (urls: Array<string>, chainHash: string): Promise<Array<NetworkClient>> {
        let chainInfo: ChainInfo
        for (const url of urls) {
            try {
                chainInfo = await HTTP.info(url, chainHash)
                break
            } catch (err) {
                if (url === urls[urls.length - 1]) {
                    throw err
                }
            }
        }
        return urls.map(url => new HTTP(url, chainInfo))
    }
}

export interface Watcher {
    watch(options: ClientOptions): AsyncGenerator<RandomnessBeacon>
    close(): Promise<void>
}

export type ClientOptions = Partial<{
    noCache: boolean
    signal: AbortSignal
    speedTestInterval: number
}>
