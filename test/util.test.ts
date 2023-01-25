import fetchMock from 'jest-fetch-mock'
import {ChainInfo, roundAt, roundTime} from '../lib'
import {jsonOrError} from '../lib/util'

beforeAll(() => {
    fetchMock.enableMocks()
})

afterAll(() => {
    fetchMock.disableMocks()
})

beforeEach(() => {
    fetchMock.resetMocks()
})

describe('roundAt', () => {
    it('should return an error when time is less than genesis', () => {
        const chainInfo = createChainInfo(1, 1)
        expect(() => roundAt(0, chainInfo)).toThrowError()
    })

    it('should get round 1 for first round', () => {
        const chainInfo = createChainInfo(0, 1)

        expect(roundAt(1, chainInfo)).toBe(1)
    })

    it('should get round 2 for second round', () => {
        const chainInfo = createChainInfo(0, 1)

        expect(roundAt(1001, chainInfo)).toBe(2)
    })

    it('should throw an error for positive infinity', () => {
        const chainInfo = createChainInfo(1595431050, 30)

        expect(() => roundAt(Infinity, chainInfo)).toThrow()
    })

    it('should throw an error for negative infinity', () => {
        const chainInfo = createChainInfo(1595431050, 30)

        expect(() => roundAt(Number.NEGATIVE_INFINITY, chainInfo)).toThrow()
    })

    it('should throw an error for NaN', () => {
        const chainInfo = createChainInfo(1595431050, 30)

        expect(() => roundAt(NaN, chainInfo)).toThrow()
    })
})

describe('roundTime', () => {
    it('should get time 0 when round is < 0', () => {
        const chainInfo = createChainInfo(0, 1)
        expect(roundTime(chainInfo, 1)).toBe(0)
    })

    it('should get time 0 for first round', () => {
        const chainInfo = createChainInfo(0, 1)
        expect(roundTime(chainInfo, 1)).toBe(0)
    })

    it('should get time 1000 for second round', () => {
        const chainInfo = createChainInfo(0, 1)

        expect(roundTime(chainInfo, 2)).toBe(1000)
    })

    it('should get time of genesis (in ms) for first round', () => {
        const chainInfo = createChainInfo(1595431050, 1)

        expect(roundTime(chainInfo, 1)).toBe(1595431050000)
    })

    it('should get time genesis + 1000 for second round', () => {
        const chainInfo = createChainInfo(1595431050, 1)

        expect(roundTime(chainInfo, 2)).toBe(1595431051000)
    })

    it('should work with different period as well', () => {
        const chainInfo = createChainInfo(1595431050, 30)

        expect(roundTime(chainInfo, 2)).toBe(1595431080000)
    })

    it('should work with a larger round number', () => {
        const chainInfo = createChainInfo(1595431050, 30)

        expect(roundTime(chainInfo, 2185561)).toBe(1660997850000)
    })

    it('should throw an error for positive infinity', () => {
        const chainInfo = createChainInfo(1595431050, 30)

        expect(() => roundTime(chainInfo, Infinity)).toThrow()
    })

    it('should throw an error for negative infinity', () => {
        const chainInfo = createChainInfo(1595431050, 30)

        expect(() => roundTime(chainInfo, Number.NEGATIVE_INFINITY)).toThrow()
    })

    it('should throw an error for NaN', () => {
        const chainInfo = createChainInfo(1595431050, 30)

        expect(() => roundTime(chainInfo, NaN)).toThrow()
    })
})

describe('jsonOrError', () => {
    it('should set user agent header if passed as an option', async () => {
        const expectedUrl = 'https://example.com/'
        const expectedUserAgent = 'some-cool-agent'
        const expectedResponse = {great: true}

        fetchMock.mockIf(expectedUrl, request => {
            const ua = request.headers.get('User-Agent')
            if (request.headers.get('User-Agent') !== expectedUserAgent) {
                throw Error(`Expected user agent ${expectedUserAgent} but got ${ua}`)
            }
            return new Promise(resolve => resolve(JSON.stringify(expectedResponse)))
        })

        const response = await jsonOrError(expectedUrl, {userAgent: expectedUserAgent})

        expect(response).toEqual(expectedResponse)
        expect(fetchMock).toHaveBeenCalledTimes(1)
    })
    it('should leave user agent empty if not passed', async () => {
        const expectedUrl = 'https://example.com/'
        const expectedResponse = {great: true}

        fetchMock.mockIf(expectedUrl, request => {
            const ua = request.headers.get('User-Agent')
            if (request.headers.get('User-Agent')) {
                throw Error(`Expected no user agent but got ${ua}`)
            }
            return new Promise(resolve => resolve(JSON.stringify(expectedResponse)))
        })

        const response = await jsonOrError(expectedUrl)

        expect(response).toEqual(expectedResponse)
        expect(fetchMock).toHaveBeenCalledTimes(1)
    })
})

function createChainInfo(genesisTime: number, period: number): ChainInfo {
    return {
        genesis_time: genesisTime,
        period,
        public_key: 'deadbeef',
        hash: 'deadbeef',
        groupHash: 'deadbeef',
        schemeID: 'bls-pedersen-chained',
        metadata: {
            beaconID: 'default'
        }
    }
}
