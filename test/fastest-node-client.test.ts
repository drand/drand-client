import fetchMock from 'jest-fetch-mock'
import MultichainClient from '../lib/fastest-node-client'
import {defaultChainOptions} from '../lib'
import {sleep} from '../lib/util'

const speedTestIntervalMs = 200
const client = new MultichainClient(
    ['https://example.com/slow', 'https://example.com/medium', 'https://example.com/fast'],
    defaultChainOptions,
    speedTestIntervalMs
)
beforeAll(() => {
    fetchMock.enableMocks()
})

afterAll(() => {
    fetchMock.disableMocks()
})

beforeEach(() => {
    fetchMock.resetMocks()
})

afterEach(() => {
    client.stop()
})

describe('multichain client', () => {
    const chainInfo = {
        public_key: '868f005eb8e6e4ca0a47c8a77ceaa5309a47978a7c71bc5cce96366b5d7a569937c529eeda66c7293784a9402801af31',
        period: 30,
        genesis_time: 1595431050,
        hash: '8990e7a9aaed2ffed73dbd7092123d6f289930540d7651336225dc172e51b2ce',
        groupHash: '176f93498eac9ca337150b46d21dd58673ea4e3581185f869672e59fa4cb390a',
        schemeID: 'pedersen-bls-chained',
        metadata: {
            beaconID: 'default'
        }
    }

    it('should throw an error if no baseUrls are provided', () => {
        expect(() => new MultichainClient([])).toThrowError()
    })

    it('should select the fastest client', async () => {
        fetchMock.mockIf(/^https?:\/\/example.com.*$/, req => {
            const response = JSON.stringify(chainInfo)
            return new Promise(resolve => {
                if (req.url.endsWith('/fast/info')) {
                    resolve(response)
                }
                if (req.url.endsWith('/medium/info')) {
                    setTimeout(() => {
                        resolve(JSON.stringify(chainInfo))
                    }, 50)
                }
                if (req.url.endsWith('/slow/info')) {
                    setTimeout(() => {
                        resolve(JSON.stringify(chainInfo))
                    }, 150)
                }
            })
        })

        client.start()
        await sleep(1000)

        expect(client.current().baseUrl).toEqual('https://example.com/fast')
    })

    it('should not consider fast errors as fast clients', async () => {
        // fastest client returns an error
        fetchMock.mockIf(/^https?:\/\/example.com.*$/, req => {
            const response = JSON.stringify(chainInfo)
            return new Promise((resolve, reject) => {
                if (req.url.endsWith('/fast/info')) {
                    reject('something broke')
                }
                if (req.url.endsWith('/medium/info')) {
                    setTimeout(() => {
                        resolve(response)
                    }, 50)
                }
                if (req.url.endsWith('/slow/info')) {
                    setTimeout(() => {
                        resolve(response)
                    }, 150)
                }
            })
        })

        client.start()
        await sleep(1000)

        // medium url client is selected because the fast one keeps returning errors
        expect(client.current().baseUrl).toEqual('https://example.com/medium')
    })
})
