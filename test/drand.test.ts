import Client, { HTTP } from '../lib/drand'
import fetch from 'node-fetch'
globalThis.fetch = fetch as any

const TESTNET_CHAIN_HASH = '84b2234fb34e835dccd048255d7ad3194b81af7d978c3bf157e3469592ae4e02'
const TESTNET_URLS = [
  'http://pl-us.testnet.drand.sh'
]

test('should get latest randomness', async () => {
  const drand = await Client.wrap(
    await HTTP.forURLs(TESTNET_URLS, TESTNET_CHAIN_HASH),
    { chainHash: TESTNET_CHAIN_HASH }
  )
  const rand = await drand.get()
  expect(rand.round > 1).toBe(true)
})

test('should get specific randomness round', async () => {
  const drand = await Client.wrap(
    await HTTP.forURLs(TESTNET_URLS, TESTNET_CHAIN_HASH),
    { chainHash: TESTNET_CHAIN_HASH }
  )
  const rand = await drand.get(256)
  expect(rand.round).toBe(256)
})

test('should abort get', async () => {
  const drand = await Client.wrap(
    await HTTP.forURLs(TESTNET_URLS, TESTNET_CHAIN_HASH),
    { chainHash: TESTNET_CHAIN_HASH }
  )

  const controller = new AbortController()
  controller.abort()

  const err = await expect(() => drand.get(1, { signal: controller.signal })).toThrow() as any
  expect(err.type).toBe('aborted')
})

test('should watch for randomness', async () => {
  const drand = await Client.wrap(
    await HTTP.forURLs(TESTNET_URLS, TESTNET_CHAIN_HASH),
    { chainHash: TESTNET_CHAIN_HASH }
  )

  const controller = new AbortController()

  let i = 0
  for await (const rand of drand.watch({ signal: controller.signal })) {
    const expectedRound = drand.roundAt(Date.now())
    expect(rand.round).toBe(expectedRound)
    if (i > 2) {
      break
    }
    i++
  }
  expect(i).toBeGreaterThan(2)
})

test('should disable beacon verification', async () => {
  const drand = await Client.wrap(
    await HTTP.forURLs(TESTNET_URLS, TESTNET_CHAIN_HASH),
    { chainHash: TESTNET_CHAIN_HASH, disableBeaconVerification: true }
  )
  const rand = await drand.get()
  expect(rand.round > 1).toBe(true)
})
