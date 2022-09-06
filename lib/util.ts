import {ChainInfo} from "./index"

export function sleep(timeMs: number): Promise<void> {
    return new Promise(resolve => {
        if (timeMs < 0) {
            resolve()
        }
        setTimeout(resolve, timeMs)
    })
}

export function roundAt(time: number, chain: ChainInfo) {
    if (time < chain.genesis_time * 1000) return 1
    return Math.floor((time - (chain.genesis_time * 1000)) / (chain.period * 1000)) + 1
}

export function roundTime(chain: ChainInfo, round: number) {
    round = round < 0 ? 0 : round
    return (chain.genesis_time + (round - 1) * chain.period) * 1000
}

export async function jsonOrError(url: string): Promise<any> {
    const response = await fetch(url)
    if (!response.ok) {
        throw Error(`Error response fetching ${url} - got ${response.status}`)
    }

    return await response.json()
}
