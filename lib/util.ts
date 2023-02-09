import {ChainInfo} from './index'
import {version} from '../package.json'

export function sleep(timeMs: number): Promise<void> {
    return new Promise(resolve => {
        if (timeMs <= 0) {
            resolve()
        }
        setTimeout(resolve, timeMs)
    })
}

export function roundAt(time: number, chain: ChainInfo) {
    if (!Number.isFinite(time)) {
        throw new Error('Cannot use Infinity or NaN as a beacon time')
    }
    if (time < chain.genesis_time * 1000) {
        throw Error('Cannot request a round before the genesis time')
    }
    return Math.floor((time - (chain.genesis_time * 1000)) / (chain.period * 1000)) + 1
}

export function roundTime(chain: ChainInfo, round: number) {
    if (!Number.isFinite(round)) {
        throw new Error('Cannot use Infinity or NaN as a round number')
    }
    round = round < 0 ? 0 : round
    return (chain.genesis_time + (round - 1) * chain.period) * 1000
}

export type HttpOptions = {
    userAgent?: string
}

export const defaultHttpOptions: HttpOptions = {
    userAgent: `drand-client-${version}`
}

// eslint-disable-next-line  @typescript-eslint/no-explicit-any
export async function jsonOrError(url: string, options: HttpOptions = defaultHttpOptions): Promise<any> {
    let requestOptions = {}

    if (options.userAgent) {
        requestOptions = {...requestOptions, headers: {['User-Agent']: options.userAgent}}
    }

    const response = await fetch(url, requestOptions)
    if (!response.ok) {
        throw Error(`Error response fetching ${url} - got ${response.status}`)
    }

    return await response.json()
}

export async function retryOnError<T>(fn: () => Promise<T>, times: number): Promise<T> {
    try {
        return await fn()
    } catch (err) {
        if (times === 0) {
            throw err
        }
        return retryOnError(fn, times - 1)
    }
}
