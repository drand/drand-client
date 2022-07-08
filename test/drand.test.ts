import Client, {HTTP, NetworkClient} from '../lib/drand'
import fetch from 'node-fetch'
import {AbortError} from '../lib/abort'

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
globalThis.fetch = fetch as any

const TESTNET_CHAIN_HASH = '84b2234fb34e835dccd048255d7ad3194b81af7d978c3bf157e3469592ae4e02'
const TESTNET_URLS = [
    'http://pl-us.testnet.drand.sh'
]
let drand: NetworkClient

afterEach(async () => {
    if (drand) {
        await drand.close()
    }
})

test('should get latest randomness', async () => {
    drand = await Client.wrap(
        await HTTP.forURLs(TESTNET_URLS, TESTNET_CHAIN_HASH),
        {chainHash: TESTNET_CHAIN_HASH}
    )
    const rand = await drand.get()
    expect(rand.round > 1).toBe(true)
})

test('should get specific randomness round', async () => {
    drand = await Client.wrap(
        await HTTP.forURLs(TESTNET_URLS, TESTNET_CHAIN_HASH),
        {chainHash: TESTNET_CHAIN_HASH}
    )
    const rand = await drand.get(256)
    expect(rand.round).toBe(256)
})

test('should abort get', async () => {
    drand = await Client.wrap(
        await HTTP.forURLs(TESTNET_URLS, TESTNET_CHAIN_HASH),
        {chainHash: TESTNET_CHAIN_HASH}
    )

    const controller = new AbortController()
    controller.abort()
    await expect(async () => drand.get(1, {
        signal: controller.signal,
        speedTestInterval: 0
    })).rejects.toThrow(new AbortError('Client aborted'))
})

test('should watch for randomness', async () => {
    drand = await Client.wrap(
        await HTTP.forURLs(TESTNET_URLS, TESTNET_CHAIN_HASH),
        {chainHash: TESTNET_CHAIN_HASH}
    )

    try {
        let i = 0
        for await(const rand of drand.watch({signal: new AbortController().signal})) {
            const expectedRound = drand.roundAt(Date.now())
            expect(rand.round).toBe(expectedRound)
            if (i > 1) {
                break
            }
            i++
        }
        expect(i).toBeGreaterThan(1)
    } catch (err) {
        // we expect an `AbortError` after `break`
        if (!(err instanceof AbortError)) {
            throw err
        }
    }
    // if we get unlucky and start just after a beacon is release we may need to wait some time for the next one
    // by default, the testnet beacons are every 30secs
}, 65000)

test('should disable beacon verification', async () => {
    drand = await Client.wrap(
        await HTTP.forURLs(TESTNET_URLS, TESTNET_CHAIN_HASH),
        {chainHash: TESTNET_CHAIN_HASH, disableBeaconVerification: true}
    )
    const rand = await drand.get()
    expect(rand.round > 1).toBe(true)
    await drand.close()
}, 10000)
