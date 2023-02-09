import {
    defaultChainOptions,
    fetchBeacon,
    fetchBeaconByTime,
    HttpChainClient,
    MultiBeaconNode,
} from '../lib'
import fetchMock from 'jest-fetch-mock'
import {testChain, validTestBeacon} from './data'
import {StubChainClient} from './stub-chain-client'

test('Beacon fetching works with testnet', async () => {
    await endToEndTest('https://pl-us.testnet.drand.sh')
})

test('Beacon fetching works with mainnet', async () => {
    await endToEndTest('https://api.drand.sh')
})

async function endToEndTest(url: string) {
    const node = new MultiBeaconNode(url)
    expect((await node.health()).status).toEqual(200)
    const chains = await node.chains()
    expect(chains).not.toHaveLength(0)

    // currently the drand-client does not support the new G1/G2 swapped scheme
    let chainToUse
    for (const chain of chains) {
        const info = await chain.info()
        if (info.schemeID === 'pedersen-bls-chained' || info.schemeID === 'pedersen-bls-unchained') {
            chainToUse = chain
            break
        }
    }

    if (!chainToUse) {
        throw Error('there was no chain with a supported scheme!')
    }

    const httpClient = new HttpChainClient(chainToUse)

    // get the latest beacon
    const latestBeacon = await fetchBeacon(httpClient)
    expect(latestBeacon.round).toBeGreaterThan(1)

    // get the first beacon
    const firstBeacon = await fetchBeacon(httpClient, 1)
    expect(firstBeacon.round).toEqual(1)

    // fail to get a nonsense round number
    await expect(() => fetchBeacon(httpClient, -1)).rejects.toThrow()

    // get a beacon from a recent time
    await expect(fetchBeaconByTime(httpClient, Date.now() - 10000)).resolves.not.toThrow()

    // fail to get a beacon from before genesis
    await expect(fetchBeaconByTime(httpClient, 0)).rejects.toThrow()
}

describe('fetch beacon', () => {
    it('should throw an error for a round number less than 1', async () => {
        const client = new StubChainClient(testChain, validTestBeacon, defaultChainOptions)

        await expect(fetchBeacon(client, -1)).rejects.toThrowError()

        expect(fetchMock).not.toHaveBeenCalled()
    })

    it('should throw an error if the returned beacon is not valid', async () => {
        const invalidBeacon = {...validTestBeacon, signature: 'deadbeefdeadbeefdeadbeefdeadbeef'}
        const client = new StubChainClient(testChain, invalidBeacon, defaultChainOptions)

        await expect(fetchBeacon(client, 1)).rejects.toThrowError()
    })

    it('should not throw an error if the returned beacon is not valid when `disableBeaconVerification` is set', async () => {
        const invalidBeacon = {...validTestBeacon, signature: 'deadbeefdeadbeefdeadbeefdeadbeef'}

        const client = new StubChainClient(testChain, invalidBeacon, {noCache: false, disableBeaconVerification: true})

        await expect(fetchBeacon(client, 1)).resolves.toEqual(invalidBeacon)
    })
})
