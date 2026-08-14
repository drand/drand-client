import fetchMock from 'jest-fetch-mock'
import {MultiBeaconNode} from '../lib'

beforeAll(() => {
    fetchMock.enableMocks()
})

afterAll(() => {
    fetchMock.disableMocks()
})

beforeEach(() => {
    fetchMock.resetMocks()
})

describe('multichain node', () => {
    const multiChainNode = new MultiBeaconNode('https://example.com')

    describe('chains', () => {
        it('should blow up if the response from the node isn\'t an array', async () => {
            fetchMock.mockResponseOnce('deadbeef')

            await expect(multiChainNode.chains()).rejects.toThrowError()
        })

        it('should create a chain object for each chain', async () => {
            fetchMock.mockResponseOnce(JSON.stringify(['deadbeef', 'cafebabe']))

            const chains = await multiChainNode.chains()

            expect(chains).toHaveLength(2)
        })

        it('should list chains from the v2 endpoint and build v2 chain urls', async () => {
            const v2Node = new MultiBeaconNode('https://example.com', {
                disableBeaconVerification: false,
                noCache: false,
                apiVersion: 'v2'
            })
            fetchMock.mockResponseOnce(JSON.stringify(['deadbeef', 'cafebabe']))

            const chains = await v2Node.chains()

            expect(fetchMock.mock.calls[0][0]).toEqual('https://example.com/v2/chains')
            expect(chains.map(c => c.baseUrl)).toEqual([
                'https://example.com/v2/chains/deadbeef',
                'https://example.com/v2/chains/cafebabe'
            ])
        })

    })
    describe('health', () => {
        it('should return the status if not 200', async () => {
            const expectedStatus = 503
            fetchMock.mockResponse('it\'s broken', {
                status: expectedStatus,
                statusText: 'Service unavailable',
            })

            const health = await multiChainNode.health()

            expect(health.status).toEqual(expectedStatus)
        })
        it('should return the correct current and expected if it is a 200', async () => {
            const expectedResponse = {current: 20, expected: 120}
            fetchMock.mockResponse(JSON.stringify(expectedResponse))

            const health = await multiChainNode.health()

            expect(health.status).toEqual(200)
            expect(health.current).toEqual(expectedResponse.current)
            expect(health.expected).toEqual(expectedResponse.expected)
        })
    })
})
