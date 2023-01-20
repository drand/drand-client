import * as bls from '@noble/bls12-381'
import {ChainedBeacon, ChainInfo, isChainedBeacon, isUnchainedBeacon, RandomnessBeacon, UnchainedBeacon} from './index'

async function verifyBeacon(chainInfo: ChainInfo, beacon: RandomnessBeacon): Promise<boolean> {
    const publicKey = chainInfo.public_key

    let message: Uint8Array
    if (isChainedBeacon(beacon, chainInfo)) {
        message = await chainedBeaconMessage(beacon)

    } else if (isUnchainedBeacon(beacon, chainInfo)) {
        message = await unchainedBeaconMessage(beacon)
    } else {
        console.error(`Beacon type ${chainInfo.schemeID} was not supported`)
        return false
    }

    const signatureVerifies = await bls.verify(beacon.signature, message, publicKey)
    if (!(signatureVerifies && await randomnessIsValid(beacon))) {
        console.error('Beacon returned was invalid')
        return false
    }
    return true
}

async function chainedBeaconMessage(beacon: ChainedBeacon): Promise<Uint8Array> {
    const message = Buffer.concat([
        signatureBuffer(beacon.previous_signature),
        roundBuffer(beacon.round)
    ])

    return await bls.utils.sha256(message)
}

async function unchainedBeaconMessage(beacon: UnchainedBeacon): Promise<Uint8Array> {
    return await bls.utils.sha256(roundBuffer(beacon.round))
}

function signatureBuffer(sig: string) {
    return Buffer.from(sig, 'hex')
}

function roundBuffer(round: number) {
    const buffer = Buffer.alloc(8)
    buffer.writeBigUInt64BE(BigInt(round))
    return buffer
}

async function randomnessIsValid(beacon: RandomnessBeacon): Promise<boolean> {
    const expectedRandomness = await bls.utils.sha256(Buffer.from(beacon.signature, 'hex'))
    return Buffer.from(beacon.randomness, 'hex').compare(expectedRandomness) == 0
}

export {verifyBeacon, roundBuffer}
