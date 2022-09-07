import fetchMock from 'jest-fetch-mock'
import {CachingChain, defaultChainOptions} from '../lib'

beforeAll(() => {
    fetchMock.enableMocks()
})
afterAll(() => {
    fetchMock.disableMocks()
})
beforeEach(() => {
    fetchMock.resetMocks()
})

describe('caching chain', () => {
    const chainInfo = {
        genesis_time: Date.now() - 1000 * 60 * 5,
        period: 15,
        public_key: 'deadbeef',
        hash: 'deadbeef',
        groupHash: 'deadbeef',
        schemeID: 'bls-pedersen-chained',
        metadata: {
            beaconID: 'default'
        }
    }
    it('should only call the network for the first request', async () => {
        // create a client with some verification options matching the expected chainInfo
        const chain = new CachingChain('https:///example.com/wow', {
            ...defaultChainOptions,
            chainVerificationParams: {
                chainHash: chainInfo.hash,
                publicKey: chainInfo.public_key
            }
        })

        fetchMock.mockResponseOnce(JSON.stringify(chainInfo))

        const response = await chain.info()
        expect(response).toEqual(chainInfo)

        const response2 = await chain.info()
        expect(response2).toEqual(chainInfo)

        expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('should throw an error if the chain hash returned does not match the verification params', async () => {
        const chain = new CachingChain('https:///example.com/wow', {
            ...defaultChainOptions,
            chainVerificationParams: {
                chainHash: 'cafebabe',
                publicKey: chainInfo.public_key
            }
        })

        fetchMock.mockResponseOnce(JSON.stringify(chainInfo))

        await expect(chain.info()).rejects.toThrowError()
    })

    it('should throw an error if the public key returned does not match the verification params', async () => {
        const chain = new CachingChain('https:///example.com/wow', {
            ...defaultChainOptions,
            chainVerificationParams: {
                chainHash: chainInfo.hash,
                publicKey: 'cafebabe'
            }
        })
        fetchMock.mockResponseOnce(JSON.stringify(chainInfo))

        await expect(chain.info()).rejects.toThrowError()
    })

    it('should not throw an error if the there are no chain verification params provided', async () => {
        // create a client with some verification options matching the expected chainInfo
        const chain = new CachingChain('https:///example.com/wow')

        fetchMock.mockResponseOnce(JSON.stringify(chainInfo))

        const response = await chain.info()
        expect(response).toEqual(chainInfo)
    })

})
