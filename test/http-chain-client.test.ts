import fetchMock from 'jest-fetch-mock'
import {HttpChainClient} from '../lib'
import {testChain, validTestBeacon} from './data'
import {defaultHttpOptions} from "../lib/util";

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
    const defaultFetchOptions = {
        headers: {
            'User-Agent': defaultHttpOptions.userAgent
        }
    }

    describe('get', () => {
        it('should call the API with the provided round number', async () => {
            const roundNumber = 1
            fetchMock.once(JSON.stringify(validTestBeacon))

            await expect(client.get(roundNumber)).resolves.toEqual(validTestBeacon)
            expect(fetchMock).toHaveBeenCalledTimes(1)
            expect(fetchMock).toHaveBeenCalledWith(`https://example.com/public/${roundNumber}`, defaultFetchOptions)
        })

        it('should call with API with a query param if noCache is set', async () => {
            const roundNumber = 1
            const client = new HttpChainClient(testChain, {noCache: true, disableBeaconVerification: false})
            fetchMock.once(JSON.stringify(validTestBeacon))

            await expect(client.get(roundNumber)).resolves.toEqual(validTestBeacon)

            // should have been with cache busting params, not just the normal latest endpoint
            expect(fetchMock).not.toHaveBeenCalledWith(`https://example.com/public/${roundNumber}`, defaultFetchOptions)
        })

        it('should pass the custom user agent to fetch', async () => {
            const roundNumber = 1
            const customUserAgent = "bananasinpyjamas"
            const client = new HttpChainClient(testChain, {
                noCache: false,
                disableBeaconVerification: false
            }, {userAgent: customUserAgent})

            fetchMock.mockIf(req => req.headers.get("User-Agent") == customUserAgent, JSON.stringify(validTestBeacon))
            await expect(client.get(roundNumber)).resolves.toEqual(validTestBeacon)
            expect(fetchMock).toHaveBeenCalledTimes(1)
            expect(fetchMock).toHaveBeenCalledWith(`https://example.com/public/${roundNumber}`, {
                "headers": {
                    "User-Agent": customUserAgent
                }
            })
        })
    })

    describe('latest', () => {
        it('should call the API with latest', async () => {
            fetchMock.once(JSON.stringify(validTestBeacon))

            await expect(client.latest()).resolves.toEqual(validTestBeacon)
            expect(fetchMock).toHaveBeenCalledTimes(1)
            expect(fetchMock).toHaveBeenCalledWith('https://example.com/public/latest', defaultFetchOptions)
        })

        it('should call with API with a query param if noCache is set', async () => {
            const client = new HttpChainClient(testChain, {noCache: true, disableBeaconVerification: false})
            fetchMock.once(JSON.stringify(validTestBeacon))

            await expect(client.latest()).resolves.toEqual(validTestBeacon)

            // should have been with random cache busting params, not just the normal `/latest` endpoint
            expect(fetchMock).not.toHaveBeenCalledWith('https://example.com/public/latest', defaultFetchOptions)
        })

        it('should pass the custom user agent to fetch', async () => {
            const customUserAgent = "bananasinpyjamas"
            const client = new HttpChainClient(testChain, {
                noCache: false,
                disableBeaconVerification: false
            }, {userAgent: customUserAgent})

            fetchMock.mockIf(req => req.headers.get("User-Agent") == customUserAgent, JSON.stringify(validTestBeacon))
            await expect(client.latest()).resolves.toEqual(validTestBeacon)
            expect(fetchMock).toHaveBeenCalledTimes(1)
            expect(fetchMock).toHaveBeenCalledWith(`https://example.com/public/latest`, {
                "headers": {
                    "User-Agent": customUserAgent
                }
            })
        })
    })
})
