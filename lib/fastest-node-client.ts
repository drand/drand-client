import {Chain, ChainClient, ChainOptions, defaultChainOptions, RandomnessBeacon} from './index'
import HttpCachingChain, {HttpChain} from './http-caching-chain'
import {createSpeedTest, SpeedTest} from './speedtest'
import HttpChainClient from './http-chain-client'

const defaultSpeedTestInterval = 1000 * 60

type SpeedTestEntry = {
    test: SpeedTest
    url: string
}

// takes an array of drand nodes and periodically speed tests them to work out which is the fastest
// it then uses the fastest client to make calls using an underlying HTTP client
// use `.start()` to enable optimisation of the underlying base URLs
// don't forget to `.stop()` it after you're finished
class FastestNodeClient implements ChainClient {

    speedTests: Array<SpeedTestEntry> = []

    constructor(
        public baseUrls: Array<string>,
        public options: ChainOptions = defaultChainOptions,
        private speedTestIntervalMs = defaultSpeedTestInterval
    ) {
        if (baseUrls.length === 0) {
            throw Error('Can\'t optimise an empty `baseUrls` array!')
        }
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
        this.speedTests = this.baseUrls.map(url => {
                const testFn = async () => {
                    await new HttpChain(url, this.options).info()
                    return
                }
                const test = createSpeedTest(testFn, this.speedTestIntervalMs)
                test.start()
                return {test, url}
            }
        )
    }

    current(): Chain {
        if (this.speedTests.length === 0) {
            console.warn('You are not currently running speed tests to choose the fastest client. Run `.start()` to speed test')
        }
        const fastestEntry = this.speedTests
            .slice()
            .sort((entry1, entry2) => entry1.test.average() - entry2.test.average())
            .shift()

        if (!fastestEntry) {
            throw Error('Somehow there were no entries to optimise! This should be impossible by now')
        }

        return new HttpCachingChain(fastestEntry.url, this.options)
    }

    stop() {
        this.speedTests.forEach(entry => entry.test.stop())
        this.speedTests = []
    }
}

export default FastestNodeClient
