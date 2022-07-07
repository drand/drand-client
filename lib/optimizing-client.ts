import {ClientOptions} from "./http"
import {NetworkClient, RandomnessBeacon} from "./drand"

const defaultSpeedTestInterval = 1000 * 60 * 5

type ClientStats = {
    client: NetworkClient,
    rtt: number,
    startTime: number
}

export default class OptimizingClient {
    // TODO: options for default request timeout and concurrency
    private options: ClientOptions
    private readonly stats: Array<ClientStats>
    private speedTestIntervalId?: number

    constructor(
        private readonly clients: Array<NetworkClient>,
        options?: ClientOptions
    ) {
        this.clients = clients
        this.stats = clients.map(c => ({client: c, rtt: 0, startTime: Date.now()}))
        this.options = {...options, speedTestInterval: options?.speedTestInterval || defaultSpeedTestInterval}
    }

    start() {
        if (this.options.speedTestInterval ?? 0 > 0) {
            this.startSpeedTesting()
        }
    }

    async get(round: number = 0, options: ClientOptions = {}): Promise<RandomnessBeacon> {
        console.log(this.fastestClients())
        const requestsUpdatingStats = this.fastestClients().map(client => this.getUpdatingStats(client, round, options))
        return Promise.any(requestsUpdatingStats).then(x => {
            console.log(this.fastestClients())

            return x
        })
    }

    async getUpdatingStats(client: NetworkClient, round: number, options: ClientOptions): Promise<RandomnessBeacon> {
        const stagedStats: Array<ClientStats> = []
        try {
            const {startTime, rtt, value, error, aborted} = await timed(() => client.get(round, options))
            if (aborted && !!error) {
                throw error
            }

            if (!value) {
                throw Error("No value was returned by the client!")
            }

            stagedStats.push({startTime, rtt, client})

            return value
        } finally {
            this.updateStats(stagedStats)
        }
    }

    async* watch(options: ClientOptions) {
        // TODO: watch and race all clients
        const client = this.fastestClients()[0]
        yield* await client.watch(options)
    }

    async info() {
        for (const client of this.clients) {
            try {
                return client.info()
            } catch (err) {
                if (client === this.clients[this.clients.length - 1]) {
                    throw err
                }
            }
        }
    }

    roundAt(time: number) {
        return this.clients[0].roundAt(time)
    }

    async close() {
        clearInterval(this.speedTestIntervalId)
        return Promise.all(this.clients.map(c => c.close()))
    }

    private startSpeedTesting() {
        const run = async () => {
            await Promise.all(this.clients.map(async c => {
                try {
                    await this.getUpdatingStats(c, 1, {noCache: true})
                } catch (_) {
                    // An abort happened
                }
            }))
        }
        this.speedTestIntervalId = setInterval(run, this.options.speedTestInterval)
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
