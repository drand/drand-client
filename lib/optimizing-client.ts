import {ClientOptions} from "./http"
import {ChainInfo, NetworkClient, RandomnessBeacon} from "./drand"
import {AbortError} from "./abort";

const defaultSpeedTestInterval = 1000 * 60 * 5

type ClientStats = {
    client: NetworkClient,
    rtt: number,
    startTime: number
}

export default class OptimizingClient implements NetworkClient {
    // TODO: options for default request timeout and concurrency
    private options: ClientOptions
    private readonly stats: Array<ClientStats>
    private speedTestIntervalId?: any

    constructor(
        private readonly clients: Array<NetworkClient>,
        options?: ClientOptions
    ) {
        this.clients = clients
        this.stats = clients.map(c => ({client: c, rtt: Number.MAX_SAFE_INTEGER, startTime: Date.now()}))
        this.options = options || {}
    }

    start(): Promise<void> {
        if (this.options.speedTestInterval ?? defaultSpeedTestInterval > 0) {
            return this.startSpeedTesting()
        }

        return Promise.resolve()
    }

    async get(round: number = 0, options: ClientOptions = {}): Promise<RandomnessBeacon> {
        const requestsUpdatingStats = this.fastestClients().map(client => this.getUpdatingStats(client, round, options))
        return Promise.any(requestsUpdatingStats).catch(err => {
            if (err instanceof AggregateError) {
                throw err.errors[0]
            }
            throw err
        })
    }

    async getUpdatingStats(client: NetworkClient, round: number, options: ClientOptions): Promise<RandomnessBeacon> {
        const stagedStats: Array<ClientStats> = []
        try {
            const {startTime, rtt, value, error, aborted} = await timed(() => client.get(round, options))
            if (aborted) {
                throw new AbortError("Client aborted")
            }

            stagedStats.push({startTime, rtt, client})
            if (!!error) {
                throw error
            }
            if (!value) {
                throw Error("No value was returned by the client!")
            }

            return value
        } finally {
            this.updateStats(stagedStats)
        }
    }

    async* watch(options: ClientOptions = {}): AsyncGenerator<RandomnessBeacon> {
        // TODO: watch and race all clients
        const client = this.fastestClients()[0]
        yield* client.watch(options)
    }

    async info(): Promise<ChainInfo> {
        for (const client of this.clients) {
            try {
                return await client.info()
            } catch (err) {
                if (client === this.clients[this.clients.length - 1]) {
                    throw err
                }
            }
        }
        throw Error("No clients returned chain info")
    }

    roundAt(time: number) {
        return this.clients[0].roundAt(time)
    }

    async close(): Promise<void> {
        clearInterval(this.speedTestIntervalId)
        return Promise.all(this.clients.map(c => c.close())).then()
    }

    private startSpeedTesting(): Promise<void> {
        const run = async () => {
            await Promise.all(this.clients.map(async c => {
                try {
                    await this.getUpdatingStats(c, 1, {noCache: true})
                } catch (_) {
                    // An abort happened
                }
            }))
        }
        this.speedTestIntervalId = setInterval(run, this.options.speedTestInterval || defaultSpeedTestInterval)
        return run()
    }

    private fastestClients() {
        return this.stats.map(s => s.client)
    }

    private updateStats(stats: Array<ClientStats>) {
        for (const next of stats) {
            for (const curr of this.stats) {
                if (curr.client === next.client) {
                    if (curr.startTime <= next.startTime) {
                        curr.rtt = next.rtt
                        curr.startTime = next.startTime
                    }
                    break
                }
            }
        }
        this.stats.sort((a, b) => a.rtt - b.rtt)
    }
}

type Timed<T> = { startTime: number, rtt: number, value?: T, error?: Error, aborted: boolean }

async function timed<T>(f: () => T): Promise<Timed<T>> {
    const startTime = Date.now()

    try {
        const value = await f()
        return {startTime, rtt: Date.now() - startTime, value, aborted: false}
    } catch (err: any) {
        if (err.name === "AbortError") {
            return {startTime, rtt: Number.MAX_SAFE_INTEGER, error: err as Error, aborted: true}
        }
        return {startTime, rtt: Number.MAX_SAFE_INTEGER, error: err as Error, aborted: false}
    }
}
