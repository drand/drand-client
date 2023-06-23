import * as bls from '@noble/bls12-381'
import {PointG1, PointG2, Fp12, pairing} from '@noble/bls12-381';

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

// @noble/bls12-381 does everything on G2, so we've implemented a manual verification for beacons on G1
type G1Hex = Uint8Array | string | PointG1;
type G2Hex = Uint8Array | string | PointG2;

function normP1(point: G1Hex): PointG1 {
    return point instanceof PointG1 ? point : PointG1.fromHex(point);
}

function normP2(point: G2Hex): PointG2 {
    return point instanceof PointG2 ? point : PointG2.fromHex(point);
}

async function normP1Hash(point: G1Hex, domainSeparationTag: string): Promise<PointG1> {
    return point instanceof PointG1 ? point : PointG1.hashToCurve(point, {DST: domainSeparationTag});
}

export async function verifySigOnG1(
    signature: G1Hex,
    message: G1Hex,
    publicKey: G2Hex,
    // default DST is the invalid one used for 'bls-unchained-on-g1' for backwards compat
    domainSeparationTag= 'BLS_SIG_BLS12381G2_XMD:SHA-256_SSWU_RO_NUL_'
): Promise<boolean> {
    const P = normP2(publicKey);
    const Hm = await normP1Hash(message, domainSeparationTag);
    const G = PointG2.BASE;
    const S = normP1(signature);
    const ePHm = pairing(Hm, P.negate(), false);
    const eGS = pairing(S, G, false);
    const exp = eGS.multiply(ePHm).finalExponentiate();
    return exp.equals(Fp12.ONE);
}

async function chainedBeaconMessage(beacon: G2ChainedBeacon): Promise<Uint8Array> {
    const message = Buffer.concat([
        signatureBuffer(beacon.previous_signature),
        roundBuffer(beacon.round)
    ])

    return bls.utils.sha256(message)
}

async function unchainedBeaconMessage(beacon: G2UnchainedBeacon | G1UnchainedBeacon): Promise<Uint8Array> {
    return bls.utils.sha256(roundBuffer(beacon.round))
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
