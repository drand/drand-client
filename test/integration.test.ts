import {fetchBeacon, fetchBeaconByTime, HttpCachingChain, HttpChainClient} from '../lib';
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
})