import * as bls from '@noble/bls12-381'
import {RandomnessBeacon} from './drand'

async function verifyBeacon(publicKey: string, beacon: RandomnessBeacon): Promise<boolean> {
    const previousSigAndRound = Buffer.concat([
        signatureBuffer(beacon.previous_signature),
        roundBuffer(beacon.round)
    ])
    const message = await bls.utils.sha256(previousSigAndRound)
    return bls.verify(beacon.signature, message, publicKey)
}

function signatureBuffer(sig: string) {
    return Buffer.from(sig, 'hex')
}

function roundBuffer(round: number) {
    const buffer = Buffer.alloc(8)
    buffer.writeBigUInt64BE(BigInt(round))
    return buffer
}

export {verifyBeacon, roundBuffer}
