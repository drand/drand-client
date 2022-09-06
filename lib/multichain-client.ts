import {Chain, ChainOptions, defaultChainOptions} from "./index";
import CachingChain from "./caching-chain";
import {createSpeedTest, SpeedTest} from "./speedtest";

const defaultSpeedTestInterval = 1000 * 60 * 5

type SpeedTestEntry = {
    test: SpeedTest
    url: string
}

// takes an array of drand nodes and periodically speed tests them to work out which is the fastest,
// using it for all calls
class MultiChainClient {

    speedTests: Array<SpeedTestEntry> = []

    constructor(
        public baseUrls: Array<string>,
        private options: ChainOptions = defaultChainOptions,
        speedTestIntervalMs = defaultSpeedTestInterval
    ) {
        if (baseUrls.length === 0) {
            throw Error("Can't optimise an empty `baseUrls` array!")
        }
        this.speedTests = baseUrls.map(url => {
                const testFn = async () => {
                    await new CachingChain(url, options).info()
                    return
                }
                const test = createSpeedTest(testFn, speedTestIntervalMs)
                return {test, url}
            }
        )
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
            throw Error("Somehow there were no entries to optimise! This should be impossible by now")
        }

        return new CachingChain(fastestEntry.url, this.options)
    }

    close() {
        this.speedTests.forEach(entry => entry.test.stop())
    }
}

export default MultiChainClient
