import {Chain, ChainClient, ChainOptions, defaultChainOptions, RandomnessBeacon} from '../lib'

// `StubChainClient` takes a beacon in the constructor which it will return when called
export class StubChainClient implements ChainClient {
    constructor(
        private myChain: Chain,
        private beacon: RandomnessBeacon,
        public options: ChainOptions = defaultChainOptions
    ) {
    }

    chain(): Chain {
        return this.myChain
    }

    async get(): Promise<RandomnessBeacon> {
        return this.beacon
    }

    async latest(): Promise<RandomnessBeacon> {
        return this.beacon
    }
}
