import { bls12_381 as bls } from '@noble/curves/bls12-381'
import { sha256 } from '@noble/hashes/sha256'
import { ensureBytes }  from '@noble/curves/abstract/utils'
import {Buffer} from 'buffer'


type PointG1 = typeof bls.G1.ProjectivePoint.ZERO
type PointG2 = typeof bls.G2.ProjectivePoint.ZERO

import {
    G2ChainedBeacon,
    ChainInfo,
    isChainedBeacon,
    isUnchainedBeacon,
    RandomnessBeacon,
    G2UnchainedBeacon,
    isG1G2SwappedBeacon,
    G1UnchainedBeacon,
    isG1Rfc9380
} from './index'

async function verifyBeacon(chainInfo: ChainInfo, beacon: RandomnessBeacon): Promise<boolean> {
    const publicKey = chainInfo.public_key

    if (!await randomnessIsValid(beacon)) {
        return false
    }

    if (isChainedBeacon(beacon, chainInfo)) {
        return bls.verify(beacon.signature, await chainedBeaconMessage(beacon), publicKey)
    }

    if (isUnchainedBeacon(beacon, chainInfo)) {
        return bls.verify(beacon.signature, await unchainedBeaconMessage(beacon), publicKey)
    }

    if (isG1G2SwappedBeacon(beacon, chainInfo)) {
        return verifySigOnG1(beacon.signature, await unchainedBeaconMessage(beacon), publicKey)
    }

    if (isG1Rfc9380(beacon, chainInfo)) {
        return verifySigOnG1(beacon.signature, await unchainedBeaconMessage(beacon), publicKey, 'BLS_SIG_BLS12381G1_XMD:SHA-256_SSWU_RO_NUL_')
    }

    console.error(`Beacon type ${chainInfo.schemeID} was not supported`)
    return false

}

// @noble/curves/bls12-381 has not yet implemented public keys on G2, so we've implemented a manual verification for beacons on G1
type G1Hex = Uint8Array | string | PointG1;
type G2Hex = Uint8Array | string | PointG2;

function normP1(point: G1Hex): PointG1 {
    return point instanceof bls.G1.ProjectivePoint ? point : bls.G1.ProjectivePoint.fromHex(point);
}

function normP2(point: G2Hex): PointG2 {
    return point instanceof bls.G2.ProjectivePoint ? point : bls.G2.ProjectivePoint.fromHex(point);
}

function normP1Hash(point: G1Hex, domainSeparationTag: string): PointG1 {
    return point instanceof bls.G1.ProjectivePoint ? point : (bls.G1.hashToCurve(ensureBytes('point', point), {DST: domainSeparationTag}) as PointG1);
}

export async function verifySigOnG1(
    signature: G1Hex,
    message: G1Hex,
    publicKey: G2Hex,
    // default DST is the invalid one used for 'bls-unchained-on-g1' for backwards compat
    domainSeparationTag= 'BLS_SIG_BLS12381G2_XMD:SHA-256_SSWU_RO_NUL_'
): Promise<boolean> {
    const P = normP2(publicKey);
    const Hm = normP1Hash(message, domainSeparationTag);
    const G = bls.G2.ProjectivePoint.BASE;
    const S = normP1(signature);
    const ePHm = bls.pairing(Hm, P.negate(), true);
    const eGS = bls.pairing(S, G, true);
    const exp = bls.fields.Fp12.mul(eGS, ePHm);
    return bls.fields.Fp12.eql(exp, bls.fields.Fp12.ONE);
}

async function chainedBeaconMessage(beacon: G2ChainedBeacon): Promise<Uint8Array> {
    const message = Buffer.concat([
        signatureBuffer(beacon.previous_signature),
        roundBuffer(beacon.round)
    ])

    return sha256(message)
}

async function unchainedBeaconMessage(beacon: G2UnchainedBeacon | G1UnchainedBeacon): Promise<Uint8Array> {
    return sha256(roundBuffer(beacon.round))
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
    const expectedRandomness = await sha256(Buffer.from(beacon.signature, 'hex'))
    return Buffer.from(beacon.randomness, 'hex').compare(expectedRandomness) == 0
}

export {verifyBeacon, roundBuffer}
