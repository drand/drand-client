import {fetchBeacon, fetchBeaconByTime, HttpCachingChain, HttpChainClient, watch} from '../lib';
import 'jest-fetch-mock'

describe('randomness client', () => {

    describe('testnet quicknet rfc9380 network', () => {
        const testnetUnchainedUrl = 'https://pl-eu.testnet.drand.sh/ddb3665060932c267aacde99049ea31f3f5a049b1741c31cf71cd5d7d11a8da2';
        const chain = new HttpCachingChain(testnetUnchainedUrl)
        const client = new HttpChainClient(chain)

        it('can consume randomness', async () => {
            const beacon = await fetchBeaconByTime(client, Date.now())
            expect(beacon.round).toBeGreaterThan(0)
        })
        it('can consume some round', async () => {
            const beacon = await fetchBeacon(client, 100)
            expect(beacon.round).toBeGreaterThan(0)
        })
        it('watch returns successive rounds', async () => {
            const generator = watch(client, new AbortController())

            const nextIsExpected = async (expectedRound: number) => {
                const beacon = await generator.next()
                expect(beacon.done).toBeFalsy()
                expect(beacon.value).toBeDefined()
                expect(beacon.value.round).toEqual(expectedRound)
            }

            const beacon = await generator.next()
            expect(beacon.value).toBeDefined()

            const round = beacon.value.round
            await nextIsExpected(round + 1)
            await nextIsExpected(round + 2)
            await nextIsExpected(round + 3)
            await nextIsExpected(round + 4)
            await nextIsExpected(round + 5)
            await nextIsExpected(round + 6)
        }, 30000) // test should be longer than the frequency
    })
})
