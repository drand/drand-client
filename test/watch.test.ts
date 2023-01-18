import {HttpCachingChain, HttpChainClient, watch} from '../lib';
import {testChain, validTestBeacon, validTestChainInfo} from './data';
import fetchMock from 'jest-fetch-mock';
import {StubChainClient} from './stub-chain-client';

beforeAll(() => {
    fetchMock.enableMocks()
})
afterAll(() => {
    fetchMock.disableMocks()
})
beforeEach(() => {
    fetchMock.resetMocks()
})

describe('watch', () => {
    it('should honour its abort controller', async () => {
        const client  = new StubChainClient(testChain, validTestBeacon)
        const abortController = new AbortController()
        const generator = watch(client, abortController)

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
    it('should retry multiple times on error if retries on failure is > 0', async () => {
        const retries = 3
        let hitCount = 0
        const url = 'https://example.com'
        const client = new HttpChainClient(new HttpCachingChain(url))
        const abort = new AbortController()

        fetchMock.mockIf(/^https:\/\/example.com.*?$/, async request => {
            if (request.url.endsWith('/info')) {
                return JSON.stringify(validTestChainInfo)
            }
            if (hitCount < retries) {
                hitCount++
                return {
                    status: 404,
                    body: 'Not found'
                }
            }
            return {
                status: 200,
                body: JSON.stringify(validTestBeacon)
            }
        })
        const generator = watch(client, abort, {retriesOnFailure: retries})
        const beacon = await generator.next()

        expect(beacon.value).toEqual(validTestBeacon)
    })
    it('should not retry if retries on failure is 0', async () => {
        const url = 'https://example.com'
        const client = new HttpChainClient(new HttpCachingChain(url))
        const abort = new AbortController()

        fetchMock.mockIf(/^https:\/\/example.com.*?$/, async request => {
            if (request.url.endsWith('/info')) {
                return JSON.stringify(validTestChainInfo)
            }
            return {
                status: 404,
                body: 'Not found'
            }
        })
        const generator = watch(client, abort, {retriesOnFailure: 0})
        await expect(() => generator.next()).rejects.toThrowError()
    })
})
