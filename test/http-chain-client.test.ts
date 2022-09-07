import fetchMock from 'jest-fetch-mock'
import {HttpChainClient} from '../lib'
import {testChain, validTestBeacon} from './data'

beforeAll(() => {
    fetchMock.enableMocks()
})
afterAll(() => {
    fetchMock.disableMocks()
})
beforeEach(() => {
    fetchMock.resetMocks()
})

describe('http chain client', () => {
    const client = new HttpChainClient(testChain)

    describe('get', () => {
        it('should call the API with the provided round number', async () => {
            const roundNumber = 1
            fetchMock.once(JSON.stringify(validTestBeacon))

            await expect(client.get(roundNumber)).resolves.toEqual(validTestBeacon)
            expect(fetchMock).toHaveBeenCalledTimes(1)
            expect(fetchMock).toHaveBeenCalledWith(`https://example.com/public/${roundNumber}`)
        })

        it('should call with API with a query param if noCache is set', async () => {
            const roundNumber = 1
            const client = new HttpChainClient(testChain, {noCache: true, disableBeaconVerification: false})
            fetchMock.once(JSON.stringify(validTestBeacon))

            await expect(client.get(roundNumber)).resolves.toEqual(validTestBeacon)

            // should have been with cache busting params, not just the normal latest endpoint
            expect(fetchMock).not.toHaveBeenCalledWith(`https://example.com/public/${roundNumber}`)
        })
    })

    describe('latest', () => {
        it('should call the API with latest', async () => {
            fetchMock.once(JSON.stringify(validTestBeacon))

            await expect(client.latest()).resolves.toEqual(validTestBeacon)
            expect(fetchMock).toHaveBeenCalledTimes(1)
            expect(fetchMock).toHaveBeenCalledWith('https://example.com/public/latest')
        })

        it('should call with API with a query param if noCache is set', async () => {
            const client = new HttpChainClient(testChain, {noCache: true, disableBeaconVerification: false})
            fetchMock.once(JSON.stringify(validTestBeacon))

            await expect(client.latest()).resolves.toEqual(validTestBeacon)

            // should have been with random cache busting params, not just the normal `/latest` endpoint
            expect(fetchMock).not.toHaveBeenCalledWith('https://example.com/public/latest')
        })
    })
})
