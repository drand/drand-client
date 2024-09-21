import { bn254 as bls } from './bn254'
import { ensureBytes }  from '@noble/curves/abstract/utils'

type PointG1 = typeof bls.G1.ProjectivePoint.ZERO
type PointG2 = typeof bls.G2.ProjectivePoint.ZERO

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

export async function verifySigOnBn254G1(
    signature: G1Hex,
    message: G1Hex,
    publicKey: G2Hex,
    // TODO: Fix to SVDW
    domainSeparationTag = 'BLS_SIG_BN254G1_XMD:KECCAK-256_SSWU_RO_NUL_'
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
