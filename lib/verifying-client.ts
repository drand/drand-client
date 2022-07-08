import {ClientOptions} from './http';
import {NetworkClient, RandomnessBeacon} from './drand';
import {verifyBeacon} from './beacon-verification';

export default class VerifyingClient implements NetworkClient {

    constructor(private client: NetworkClient) {}

    async get(round: number, options: ClientOptions = {}) {
        const rand = await this.client.get(round, options)
        return this.verify(rand)
    }

    info () {
        return this.client.info()
    }

    async close () {
        return this.client.close()
    }

    async* watch(options: ClientOptions = {}): AsyncGenerator<RandomnessBeacon> {
        yield* this.client.watch(options)
    }

    private async verify (rand: RandomnessBeacon) {
        // TODO: full/partial chain verification
        const info = await this.info()
        const beaconValid = await verifyBeacon(info.public_key, rand)
        if (!beaconValid) {
            throw Error(`Round ${rand.round} beacon signature was not valid!!`)
        }
        // TODO: derive the randomness from the signature
        return { ...rand }
    }

    roundAt (time: number) {
        return this.client.roundAt(time)
    }
}