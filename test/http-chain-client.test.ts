import fetchMock from "jest-fetch-mock"
import {HttpChainClient} from "../lib"

beforeAll(() => {
    fetchMock.enableMocks()
})
afterAll(() => {
    fetchMock.disableMocks()
})
beforeEach(() => {
    fetchMock.resetMocks()
})

describe("http chain client", () => {
    const client = new HttpChainClient()
    const chainInfo = {
        public_key: "868f005eb8e6e4ca0a47c8a77ceaa5309a47978a7c71bc5cce96366b5d7a569937c529eeda66c7293784a9402801af31",
        period: 30,
        genesis_time: 1595431050,
        hash: "8990e7a9aaed2ffed73dbd7092123d6f289930540d7651336225dc172e51b2ce",
        groupHash: "176f93498eac9ca337150b46d21dd58673ea4e3581185f869672e59fa4cb390a",
        schemeID: "pedersen-bls-chained",
        metadata: {
            beaconID: "default"
        }
    }
    const chain = {
        baseUrl: "https://example.com",
        info: () => Promise.resolve(chainInfo)
    }
    const roundOne = {
        round: 1,
        randomness: "101297f1ca7dc44ef6088d94ad5fb7ba03455dc33d53ddb412bbc4564ed986ec",
        signature: "8d61d9100567de44682506aea1a7a6fa6e5491cd27a0a0ed349ef6910ac5ac20ff7bc3e09d7c046566c9f7f3c6f3b10104990e7cb424998203d8f7de586fb7fa5f60045417a432684f85093b06ca91c769f0e7ca19268375e659c2a2352b4655",
        previous_signature: "176f93498eac9ca337150b46d21dd58673ea4e3581185f869672e59fa4cb390a"
    }

    describe("get", () => {
        it("should throw an error for a round number less than 1", async () => {
            await expect(client.get(chain, 0)).rejects.toThrowError()
            expect(fetchMock).not.toHaveBeenCalled()
        })

        it("should call the API with the provided round number", async () => {
            const roundNumber = 1
            fetchMock.once(JSON.stringify(roundOne))

            await expect(client.get(chain, roundNumber)).resolves.toEqual(roundOne)
            expect(fetchMock).toHaveBeenCalledTimes(1)
            expect(fetchMock).toHaveBeenCalledWith(`https://example.com/public/${roundNumber}`)
        })
    })

    describe("latest", () => {
        it("should call the API with latest", async () => {
            fetchMock.once(JSON.stringify(roundOne))

            await expect(client.latest(chain)).resolves.toEqual(roundOne)
            expect(fetchMock).toHaveBeenCalledTimes(1)
            expect(fetchMock).toHaveBeenCalledWith("https://example.com/public/latest")
        })
    })

    describe("fetch round", () => {
        it("should throw an error if the returned beacon is not valid", async () => {
            const invalidBeacon = {...roundOne, signature: "deadbeefdeadbeefdeadbeefdeadbeef"}
            fetchMock.once(JSON.stringify(invalidBeacon))

            // requesting round 2
            await expect(client.fetchRound(chain, "1")).rejects.toThrowError()
        })

        it("should not throw an error if the returned beacon is not valid when `disableBeaconVerification` is set", async () => {
            const client = new HttpChainClient({noCache: false, disableBeaconVerification: true})

            const invalidBeacon = {...roundOne, signature: "deadbeefdeadbeefdeadbeefdeadbeef"}
            fetchMock.once(JSON.stringify(invalidBeacon))

            // requesting round 2
            await expect(client.fetchRound(chain, "1")).resolves.toEqual(invalidBeacon)
        })

        it("should call with API with a query param if noCache is set", async () => {
            const client = new HttpChainClient({noCache: true, disableBeaconVerification: false})
            fetchMock.once(JSON.stringify(roundOne))

            await expect(client.fetchRound(chain, "latest")).resolves.toEqual(roundOne)

            // should have been with cache busting params, not just the normal latest endpoint
            expect(fetchMock).not.toHaveBeenCalledWith("https://example.com/public/latest")
        })
    })
})
