import {fetchBeacon, fetchBeaconByTime, HttpChainClient, MultiChainNode, watch} from "../lib"
import "isomorphic-fetch"

const httpClient = new HttpChainClient()

test("Beacon fetching works with testnet", async () => {
    // connect to testnet
    const node = new MultiChainNode("https://pl-us.testnet.drand.sh")
    expect((await node.health()).status).toEqual(200)
    const chains = await node.chains()
    expect(await node.chains()).not.toHaveLength(0)

    // get the latest beacon
    const latestBeacon = await fetchBeacon(chains[0], httpClient)
    expect(latestBeacon.round).toBeGreaterThan(1)

    // get the first beacon
    const firstBeacon = await fetchBeacon(chains[0], httpClient, 1)
    expect(firstBeacon.round).toEqual(1)

    // fail to get a nonsense round number
    await expect(() => fetchBeacon(chains[0], httpClient, -1)).rejects.toThrow()

    // get a beacon from a recent time
    await expect(fetchBeaconByTime(chains[0], httpClient, Date.now() - 10000)).resolves.not.toThrow()

    // fail to get a beacon from before genesis
    await expect(fetchBeaconByTime(chains[0], httpClient, 0)).rejects.toThrow()
})

test("watch honours its abort controller", async () => {
    // connect to testnet
    const node = new MultiChainNode("https://pl-us.testnet.drand.sh")
    expect((await node.health()).status).toEqual(200)
    const chains = await node.chains()
    expect(await node.chains()).not.toHaveLength(0)

    // start watching the chain
    const abortController = new AbortController()
    const generator = watch(chains[0], httpClient, abortController)

    // get a value
    const firstValue = await generator.next()
    expect(firstValue.value).toBeDefined()

    // cancel watching
    abortController.abort("some reason")

    // there are no values left
    const finishedValue = await generator.next()
    expect(finishedValue.done).toEqual(true)
    expect(finishedValue.value).toBeUndefined()
})