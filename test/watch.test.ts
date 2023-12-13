import {HttpCachingChain, HttpChainClient, watch} from '../lib';
import {validTestBeacon, validTestChainInfo} from './data';
import fetchMock from 'jest-fetch-mock';

describe('watch', () => {
    it('should honour its abort controller', async () => {
        const client = new HttpChainClient(new HttpCachingChain('https://pl-eu.testnet.drand.sh'))
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
        fetchMock.enableMocks()

        const retries = 3
        let hitCount = 0
        const url = 'https://example.com'
        const client = new HttpChainClient(new HttpCachingChain(url))
        const abort = new AbortController()

        fetchMock.mockIf(/^https:\/\/example.com.*?$/, async request => {
            if (request.url.endsWith('/info')) {
                // we modify the genesis time to now, so round == 1
                return JSON.stringify({ ...validTestChainInfo, genesis_time: Date.now() / 1000 } )
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
        fetchMock.disableMocks()
    })
    it('should not retry if retries on failure is 0', async () => {
        fetchMock.enableMocks()

        const url = 'https://example.com'
        const client = new HttpChainClient(new HttpCachingChain(url))
        const abort = new AbortController()

        fetchMock.mockIf(/^https:\/\/example.com.*?$/, async request => {
            if (request.url.endsWith('/info')) {
                // we modify the genesis time to now, so round == 1
                return JSON.stringify({ ...validTestChainInfo, genesis_time: Date.now() / 1000 } )
            }
            return {
                status: 404,
                body: 'Not found'
            }
        })
        const generator = watch(client, abort, {retriesOnFailure: 0})
        await expect(() => generator.next()).rejects.toThrowError()
        fetchMock.disableMocks()
    })
})
