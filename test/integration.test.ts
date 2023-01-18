import {fetchBeacon, fetchBeaconByTime, HttpCachingChain, HttpChainClient, watch} from '../lib';
import 'jest-fetch-mock'

describe('randomness client', () => {
    const chain = new HttpCachingChain('https://pl-eu.testnet.drand.sh')
    const client = new HttpChainClient(chain)

    it('can consume randomness', async () => {
        const beacon = await fetchBeaconByTime(client, Date.now())
        expect(beacon.round).toBeGreaterThan(0)
    })
    it('can consume some round', async () => {
        const beacon = await fetchBeacon(client, 2568884)
        expect(beacon.round).toBeGreaterThan(0)
    })
    it('watch returns successive rounds', async () => {
        const generator = watch(client, new AbortController())

        const beacon = await generator.next()
        expect(beacon.value).toBeDefined()

        const secondBeacon = await generator.next()
        expect(secondBeacon.value).toBeDefined()

        expect(beacon.value.round + 1).toEqual(secondBeacon.value.round)
    }, 35000) // test should be longer than the frequency
})