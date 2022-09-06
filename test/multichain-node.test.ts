import fetchMock from "jest-fetch-mock"
import {MultiChainNode} from "../lib";

beforeAll(() => {
    fetchMock.enableMocks()
})

afterAll(() => {
    fetchMock.disableMocks()
})

beforeEach(() => {
    fetchMock.resetMocks()
})

describe("multichain node", () => {
    const multiChainNode = new MultiChainNode("https://example.com")

    describe("chains", () => {
        it("should blow up if the response from the node isn't an array", async () => {
            fetchMock.mockResponseOnce("deadbeef")

            await expect(multiChainNode.chains()).rejects.toThrowError()
        })

        it("should create a chain object for each chain", async () => {
            fetchMock.mockResponseOnce(JSON.stringify(["deadbeef", "cafebabe"]))

            const chains = await multiChainNode.chains()

            expect(chains).toHaveLength(2)
        })

    })
    describe("health", () => {
        it("should return the status if not 200", async () => {
            const expectedStatus = 503
            fetchMock.mockResponse("it's broken", {
                status: expectedStatus,
                statusText: "Service unavailable",
            })

            const health = await multiChainNode.health()

            expect(health.status).toEqual(expectedStatus)
        })
        it("should return the correct current and expected if it is a 200", async () => {
            const expectedResponse = {current: 20, expected: 120}
            fetchMock.mockResponse(JSON.stringify(expectedResponse))

            const health = await multiChainNode.health()

            expect(health.status).toEqual(200)
            expect(health.current).toEqual(expectedResponse.current)
            expect(health.expected).toEqual(expectedResponse.expected)
        })
    })
})
