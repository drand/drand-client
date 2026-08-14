import {apiVersionOf, normaliseBeacon, normaliseChainInfo, randomnessFromSignature, roundEndpoint} from '../lib/api'
import {
    validTestBeacon,
    validTestChainInfo,
    validV2BeaconNormalised,
    validV2BeaconResponse,
    validV2ChainInfoResponse
} from './data'

describe('api versions', () => {
    describe('apiVersionOf', () => {
        it('defaults to v1 when unset', () => {
            expect(apiVersionOf({})).toEqual('v1')
        })
        it('returns the configured version', () => {
            expect(apiVersionOf({apiVersion: 'v2'})).toEqual('v2')
        })
    })

    describe('roundEndpoint', () => {
        it('uses the `public` collection for v1', () => {
            expect(roundEndpoint('v1', 1)).toEqual('public/1')
            expect(roundEndpoint('v1', 'latest')).toEqual('public/latest')
        })
        it('uses the `rounds` collection for v2', () => {
            expect(roundEndpoint('v2', 1)).toEqual('rounds/1')
            expect(roundEndpoint('v2', 'latest')).toEqual('rounds/latest')
        })
    })

    describe('normaliseChainInfo', () => {
        it('passes v1 chain info through unchanged', () => {
            expect(normaliseChainInfo(validTestChainInfo)).toEqual(validTestChainInfo)
        })
        it('maps a v2 chain info response onto the internal shape', () => {
            expect(normaliseChainInfo(validV2ChainInfoResponse)).toEqual(validTestChainInfo)
        })
    })

    describe('normaliseBeacon', () => {
        it('leaves a v1 beacon (which already has randomness) untouched', () => {
            expect(normaliseBeacon(validTestBeacon)).toEqual(validTestBeacon)
        })
        it('derives randomness for a v2 beacon that omits it', () => {
            expect(normaliseBeacon(validV2BeaconResponse)).toEqual(validV2BeaconNormalised)
        })
    })

    describe('randomnessFromSignature', () => {
        it('is the sha256 of the signature bytes', () => {
            expect(randomnessFromSignature(validV2BeaconResponse.signature))
                .toEqual(validV2BeaconNormalised.randomness)
        })
    })
})
