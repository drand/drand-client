import test from 'ava'
import HTTP from './http.js'
import Optimizing from './optimizing.js'
import fetch from 'node-fetch'
import AbortController from 'abort-controller'

global.fetch = fetch
global.AbortController = AbortController

const TESTNET_CHAIN_HASH = '5107ecb951646809bf9d56c44168182986e8469aadb906597ede430e24a0408b'
const TESTNET_URLS = [
  'http://pl-eu.testnet.drand.sh',
  'http://pl-us.testnet.drand.sh',
  'http://pl-sin.testnet.drand.sh'
]

test('should get randomness from working client', async t => {
  const info = await HTTP.info(TESTNET_URLS[0], TESTNET_CHAIN_HASH)

  const faultyClient = {
    async get () {
      throw new Error('boom')
    }
  }

  const client = new Optimizing([faultyClient, new HTTP(TESTNET_URLS[0], info)])
  t.deepEqual((await client.get(1)).round, 1)
})

test('should fail to get randomness if all clients fail', async t => {
  let calls = 0
  const faultyClient = () => ({
    async get () {
      calls++
      throw new Error('boom')
    }
  })

  const client = new Optimizing([faultyClient(), faultyClient()])
  const err = await t.throwsAsync(client.get(1))
  t.is(err.message, 'boom')
  t.is(calls, 2)
})

test('should get info from working client', async t => {
  const info = await HTTP.info(TESTNET_URLS[0], TESTNET_CHAIN_HASH)

  const faultyClient = {
    async info () {
      throw new Error('boom')
    }
  }

  const client = new Optimizing([faultyClient, new HTTP(TESTNET_URLS[0], info)])
  t.deepEqual(await client.info(), info)
})

test('should fail to get info if all clients fail', async t => {
  let calls = 0
  const faultyClient = () => ({
    async info () {
      calls++
      throw new Error('boom')
    }
  })

  const client = new Optimizing([faultyClient(), faultyClient()])
  const err = await t.throwsAsync(client.info())
  t.is(err.message, 'boom')
  t.is(calls, 2)
})
