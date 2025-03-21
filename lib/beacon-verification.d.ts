/// <reference types="node" />
import { bls12_381 as bls } from '@noble/curves/bls12-381';
import { Buffer } from 'buffer';
import { ChainInfo, RandomnessBeacon } from './index';
type PointG1 = typeof bls.G1.ProjectivePoint.ZERO;
type PointG2 = typeof bls.G2.ProjectivePoint.ZERO;
declare function verifyBeacon(chainInfo: ChainInfo, beacon: RandomnessBeacon, expectedRound: number): Promise<boolean>;
type G1Hex = Uint8Array | string | PointG1;
type G2Hex = Uint8Array | string | PointG2;
export declare function verifySigOnG1(signature: G1Hex, message: G1Hex, publicKey: G2Hex, domainSeparationTag?: string): Promise<boolean>;
declare function roundBuffer(round: number): Buffer;
export { verifyBeacon, roundBuffer };
