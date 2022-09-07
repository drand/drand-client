import {Chain, ChainClient, ChainOptions, defaultChainOptions, RandomnessBeacon} from './index'
import HttpCachingChain, {HttpChain} from './http-caching-chain'
import {createSpeedTest, SpeedTest} from './speedtest'
import HttpChainClient from "./http-chain-client";

const defaultSpeedTestInterval = 1000 * 60

type SpeedTestEntry = {
    test: SpeedTest
    url: string
}

// takes an array of drand nodes and periodically speed tests them to work out which is the fastest
// it then uses the fastest client to make calls using an underlying HTTP client
class FastestNodeClient implements ChainClient {

    speedTests: Array<SpeedTestEntry> = []

    constructor(
        public baseUrls: Array<string>,
        private options: ChainOptions = defaultChainOptions,
        speedTestIntervalMs = defaultSpeedTestInterval
    ) {
        if (baseUrls.length === 0) {
            throw Error('Can\'t optimise an empty `baseUrls` array!')
        }
        this.speedTests = baseUrls.map(url => {
                const testFn = async () => {
                    await new HttpChain(url, options).info()
                    return
                }
                const test = createSpeedTest(testFn, speedTestIntervalMs)
                return {test, url}
            }
        )
    }

    async latest(): Promise<RandomnessBeacon> {
        return new HttpChainClient(this.current(), this.options).latest()
    }

    async get(roundNumber: number): Promise<RandomnessBeacon> {
        return new HttpChainClient(this.current(), this.options).get(roundNumber)
    }

    chain(): Chain {
        return this.current()
    }

    start() {
        this.speedTests.forEach(entry => entry.test.start())
    }

    current(): Chain {
        const fastestEntry = this.speedTests
            .slice()
            .sort((entry1, entry2) => entry1.test.average() - entry2.test.average())
            .shift()

        if (!fastestEntry) {
            throw Error('Somehow there were no entries to optimise! This should be impossible by now')
        }

        return new HttpCachingChain(fastestEntry.url, this.options)
    }

    close() {
        this.speedTests.forEach(entry => entry.test.stop())
    }
}

export default FastestNodeClient
