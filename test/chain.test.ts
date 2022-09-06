import {ChainInfo, roundAt, roundTime} from "../lib";

test('should get round 1 when time is less than genesis', () => {
    const chainInfo = createChainInfo(0, 1)
    expect(roundAt(0, chainInfo)).toBe(1)
})

test('should get round 1 for first round', () => {
    const chainInfo = createChainInfo(0, 1)

    expect(roundAt(1, chainInfo)).toBe(1)
})

test('should get round 2 for second round', () => {
    const chainInfo = createChainInfo(0, 1)

    expect(roundAt(1001, chainInfo)).toBe(2)
})

test('should get time 0 when round is < 0', () => {
    const chainInfo = createChainInfo(0, 1)
    expect(roundTime(chainInfo, 1)).toBe(0)
})

test('should get time 0 for first round', () => {
    const chainInfo = createChainInfo(0, 1)
    expect(roundTime(chainInfo, 1)).toBe(0)
})

test('should get time 1000 for second round', () => {
    const chainInfo = createChainInfo(0, 1)

    expect(roundTime(chainInfo, 2)).toBe(1000)
})

test('should get time of genesis (in ms) for first round', () => {
    const chainInfo = createChainInfo(1595431050, 1)

    expect(roundTime(chainInfo, 1)).toBe(1595431050000)
})

test('should get time genesis + 1000 for second round', () => {
    const chainInfo = createChainInfo(1595431050, 1)

    expect(roundTime(chainInfo, 2)).toBe(1595431051000)
})

test('should work with different period as well', () => {
    const chainInfo = createChainInfo(1595431050, 30)

    expect(roundTime(chainInfo, 2)).toBe(1595431080000)
})

test('and should work with a larger round number', () => {
    const chainInfo = createChainInfo(1595431050, 30)

    expect(roundTime(chainInfo, 2185561)).toBe(1660997850000)
})

function createChainInfo(genesisTime: number, period: number): ChainInfo {
    return {
        genesis_time: genesisTime,
        period,
        public_key: "deadbeef",
        hash: "deadbeef",
        groupHash: "deadbeef",
        schemeID: "bls-pedersen-chained",
        metadata: {
            beaconID: "default"
        }
    }
}