import 'isomorphic-fetch'
import {
    defaultChainOptions,
    fetchBeacon,
    fetchBeaconByTime,
    HttpChainClient,
    MultiBeaconNode,
    watch
} from '../lib'
import fetchMock from 'jest-fetch-mock'
import {testChain, validTestBeacon} from './data'
import {StubChainClient} from './stub-chain-client'

test('Beacon fetching works with testnet', async () => {
    // connect to testnet
    const node = new MultiBeaconNode('https://pl-us.testnet.drand.sh')
    expect((await node.health()).status).toEqual(200)
    const chains = await node.chains()
    expect(await node.chains()).not.toHaveLength(0)

    const httpClient = new HttpChainClient(chains[0])

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
})

test('watch honours its abort controller', async () => {
    // connect to testnet
    const node = new MultiBeaconNode('https://pl-us.testnet.drand.sh')
    expect((await node.health()).status).toEqual(200)
    const chains = await node.chains()
    expect(await node.chains()).not.toHaveLength(0)

    // start watching the chain
    const httpClient = new HttpChainClient(chains[0])
    const abortController = new AbortController()
    const generator = watch(httpClient, abortController)

    // get a value
    const firstValue = await generator.next()
    expect(firstValue.value).toBeDefined()

    // cancel watching
    abortController.abort('some reason')

    // there are no values left
    const finishedValue = await generator.next()
    expect(finishedValue.done).toEqual(true)
    expect(finishedValue.value).toBeUndefined()
})

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
