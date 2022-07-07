import {ChainInfo, NetworkClient, RandomnessBeacon} from "./drand";
import {ClientOptions} from "./http";
import {controllerWithParent, waitOrAbort} from "./abort";
import Chain from "./chain";

export default class PollingWatcher {
    controllers: Array<AbortController> = []

    constructor(private client: NetworkClient, private chainInfo: ChainInfo) {}

    async * watch(options: ClientOptions = {}): AsyncGenerator<RandomnessBeacon> {
        const controller = controllerWithParent(options.signal)
        this.controllers.push(controller)
        const clientOptions = { signal: controller.signal }

        try {
            let round = this.client.roundAt(Date.now())
            let rand = await this.client.get(round, clientOptions)
            yield rand

            while (true) {
                const round = this.client.roundAt(Date.now())
                yield this.client.get(round, clientOptions)

                const nextRoundTime = Chain.roundTime(round + 1, this.chainInfo.genesis_time * 1000, this.chainInfo.period * 1000)
                await waitOrAbort(nextRoundTime, controller.signal)
            }
        } finally {
            this.controllers = this.controllers.filter(c => c !== controller)
            controller.abort()
        }
    }

    async close(): Promise<void> {
        this.controllers.forEach(c => c.abort())
        this.controllers = []
    }
}
