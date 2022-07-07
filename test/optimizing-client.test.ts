import HTTP, {ClientOptions} from '../lib/http'
import OptimizingClient from '../lib/optimizing-client'
import Mock from './client-stub'
import {RandomnessBeacon} from "../lib/drand";

import fetch from 'node-fetch'

globalThis.fetch = fetch as any;

const TESTNET_CHAIN_HASH = '84b2234fb34e835dccd048255d7ad3194b81af7d978c3bf157e3469592ae4e02'
const TESTNET_URLS = [
    'http://pl-us.testnet.drand.sh'
]

test('should get randomness from working client', async () => {
    const info = await HTTP.info(TESTNET_URLS[0], TESTNET_CHAIN_HASH)

    const faultyClient = {
        async get() {
            throw new Error('boom')
        },
    }

    const client = new OptimizingClient([faultyClient as any, new HTTP(TESTNET_URLS[0], info)])
    expect((await client.get(1)).round).toEqual(1)
})

test('should fail to get randomness if all clients fail', async () => {
    let calls = 0
    const faultyClient = () => ({
        async get() {
            calls++
            throw new Error('boom')
        }
    })

    const client = new OptimizingClient([faultyClient() as any, faultyClient() as any])
    await expect(() => client.get(1)).rejects.toThrow("All promises were rejected")
    expect(calls).toBe(2)
})

test('should get info from working client', async () => {
    const info = await HTTP.info(TESTNET_URLS[0], TESTNET_CHAIN_HASH)

    const faultyClient = {
        async info() {
            throw new Error('boom')
        }
    }

    const client = new OptimizingClient([faultyClient as any, new HTTP(TESTNET_URLS[0], info)])
    expect(await client.info()).toEqual(info)
})

test('should fail to get info if all clients fail', async () => {
    let calls = 0
    const faultyClient = () => ({
        async info() {
            calls++
            throw new Error('boom')
        }
    })

    const client = new OptimizingClient([faultyClient() as any, faultyClient() as any])
    await expect(() => client.info()).rejects.toThrow("boom")
    expect(calls).toBe(2)
})

test('should get from the fastest client', async () => {
    const fastBeacons = [{round: 138}, {round: 139}, {round: 140}]
    const fast = new Mock({beacons: [{round: 1}, ...fastBeacons]})

    // This client shouldn't be used other than for the speed test
    class Slow extends Mock {
        get(round: number, options: ClientOptions) {
            if (round !== 1) throw new Error(`not expected to call get other than for speed test (${round})`)
            return super.get(round, options)
        }
    }

    const slow = new Slow({beacons: [{round: 1, delay: 100}]}) as any

    const client = new OptimizingClient([slow, fast])
    try {
        await client.start()

        for (const beacon of fastBeacons) {
            const b = await client.get(beacon.round)
            expect(b.round).toBe(beacon.round)
        }
    } finally {
        await client.close()
    }
})

test('should watch from the fastest client', async () => {
    const chainInfo = {
        period: 1,
        public_key: "deadbeefdeadbeef",
        genesis_time: Date.now(),
        hash: "deadbeef",
        groupHash: "cafebabecafebabe",
        schemeID: "pedersen-bls-chained",
        metadata: {
            beaconID: "deadbeefcafebabe",
        }
    }

    const fastBeacons = [{round: 138}, {round: 139}, {round: 140}]
    const fast = new Mock({
        beacons: [{round: 1}, ...fastBeacons],
        latestBeaconIndex: 1,
        chainInfo
    })

    // This client shouldn't be used other than for the speed test
    class Slow extends Mock {
        watch(): AsyncGenerator<RandomnessBeacon> {
            throw new Error('not expected to call watch')
        }
    }

    const slow = new Slow({beacons: [{round: 1, delay: 100}]}) as any

    const client = new OptimizingClient([slow, fast])
    try {
        // client does an initial speed test and orders the clients by response time
        await client.start()

        // `watch` ought to use the fast client
        // if it uses the slow client, it will throw an error
        const watchedBeacons = await client.watch()

        // check the beacons come out and in the right order
        for (const beacon of fastBeacons) {
            const b = (await watchedBeacons.next()).value
            expect(b.round).toBe(beacon.round)
        }
    } finally {
        await client.close()
    }
})

test('should switch to a faster client', async () => {
    const beacons = [{round: 138}, {round: 139}, {round: 140}]

    class FastThenSlow extends Mock {
        get(round: number, options: ClientOptions) {
            if (round > 139) throw new Error(`not expected to be asked for beacons > 139 (${round})`)
            return super.get(round, options)
        }
    }

    const fastThenSlow = new FastThenSlow({
        beacons: [{round: 1}, ...[beacons[0], ...beacons.slice(1).map(b => ({...b, delay: 200}))]]
    })

    class Steady extends Mock {
        get(round: number, options: ClientOptions) {
            if (round > 1 && round < 140) throw new Error(`not expected to be asked for beacons < 140 (${round})`)
            return super.get(round, options)
        }
    }

    const steady = new Steady({beacons: [{round: 1, delay: 100}, ...beacons.map(b => ({...b, delay: 100}))]}) as any

    const client = new OptimizingClient([fastThenSlow, steady])
    try {
        await client.start()

        for (const beacon of beacons) {
            const b = await client.get(beacon.round)
            expect(b.round).toBe(beacon.round)
        }
    } finally {
        await client.close()
    }
})
