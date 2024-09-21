/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
/* Modified by kevincharm to support drand evmnet */
import { AffinePoint } from '@noble/curves/abstract/weierstrass.js'
import { randomBytes } from '@noble/hashes/utils'
import { bls, CurveFn } from '@noble/curves/abstract/bls'
import { Field } from '@noble/curves/abstract/modular'
import {
    bitGet,
    bitLen,
    concatBytes as concatB,
    notImplemented,
} from '@noble/curves/abstract/utils'
import { tower12, psiFrobenius } from '@noble/curves/abstract/tower'
// Types
import type { Fp, Fp2, Fp6, Fp12 } from '@noble/curves/abstract/tower'
import * as mod from '@noble/curves/abstract/modular'
import { keccak_256 } from '@noble/hashes/sha3'
import {
    bytesToNumberBE,
    Hex,
    numberToBytesBE,
} from '@noble/curves/abstract/utils'
import { ProjPointType } from '@noble/curves/abstract/weierstrass'

/*
bn254, previously known as alt_bn_128, when it had 128-bit security.
Barbulescu-Duquesne 2017 shown it's weaker: just about 100 bits,
so the naming has been adjusted to its prime bit count:
https://hal.science/hal-01534101/file/main.pdf

There are huge compatibility issues in the ecosystem:

1. Different libraries call it in different ways: "bn254", "bn256", "alt_bn128", "bn128".
2. libff has bn128, but it's a different curve with different G2:
   https://github.com/scipr-lab/libff/blob/a44f482e18b8ac04d034c193bd9d7df7817ad73f/libff/algebra/curves/bn128/bn128_init.cpp#L166-L169
3. halo2curves bn256 is also incompatible and returns different outputs

The goal of our implementation is to support "Ethereum" variant of the curve,
because it at least has specs:

- EIP196 (https://eips.ethereum.org/EIPS/eip-196) describes bn254 ECADD and ECMUL opcodes for EVM
- EIP197 (https://eips.ethereum.org/EIPS/eip-197) describes bn254 pairings
- It's hard: EIPs don't have proper tests. EIP-197 returns boolean output instead of Fp12
- The existing implementations are bad. Some are deprecated:
    - https://github.com/paritytech/bn (old version)
    - https://github.com/ewasm/ethereum-bn128.rs (uses paritytech/bn)
    - https://github.com/zcash-hackworks/bn
    - https://github.com/arkworks-rs/curves/blob/master/bn254/src/lib.rs
- Python implementations use different towers and produce different Fp12 outputs:
    - https://github.com/ethereum/py_pairing
    - https://github.com/ethereum/execution-specs/blob/master/src/ethereum/crypto/alt_bn128.py
- Points are encoded differently in different implementations
*/

// prettier-ignore
const _0n = BigInt(0), _1n = BigInt(1), _2n = BigInt(2), _3n = BigInt(3);
// prettier-ignore
const _6n = BigInt(6);

/*
Seed (X): 4965661367192848881
Fr: (36x⁴+36x³+18x²+6x+1)
Fp: (36x⁴+36x³+24x²+6x+1)
(E  / Fp ): Y² = X³+3
(Et / Fp²): Y² = X³+3/(u+9) (D-type twist)
Ate loop size: 6x+2

Towers:
- Fp²[u] = Fp/u²+1
- Fp⁶[v] = Fp²/v³-9-u
- Fp¹²[w] = Fp⁶/w²-v
*/
const BN_X = BigInt('4965661367192848881')
const BN_X_LEN = bitLen(BN_X)
const SIX_X_SQUARED = _6n * BN_X ** _2n

// Finite field over r. It's for convenience and is not used in the code below.
const Fr = Field(
    BigInt('21888242871839275222246405745257275088548364400416034343698204186575808495617'),
)
// Fp2.div(Fp2.mul(Fp2.ONE, _3n), Fp2.NONRESIDUE)
const Fp2B = {
    c0: BigInt('19485874751759354771024239261021720505790618469301721065564631296452457478373'),
    c1: BigInt('266929791119991161246907387137283842545076965332900288569378510910307636690'),
}

const { Fp, Fp2, Fp6, Fp4Square, Fp12 } = tower12({
    ORDER: BigInt('21888242871839275222246405745257275088696311157297823662689037894645226208583'),
    FP2_NONRESIDUE: [BigInt(9), _1n],
    Fp2mulByB: (num) => Fp2.mul(num, Fp2B),
    // The result of any pairing is in a cyclotomic subgroup
    // https://eprint.iacr.org/2009/565.pdf
    Fp12cyclotomicSquare: ({ c0, c1 }): Fp12 => {
        const { c0: c0c0, c1: c0c1, c2: c0c2 } = c0
        const { c0: c1c0, c1: c1c1, c2: c1c2 } = c1
        const { first: t3, second: t4 } = Fp4Square(c0c0, c1c1)
        const { first: t5, second: t6 } = Fp4Square(c1c0, c0c2)
        const { first: t7, second: t8 } = Fp4Square(c0c1, c1c2)
        let t9 = Fp2.mulByNonresidue(t8) // T8 * (u + 1)
        return {
            c0: Fp6.create({
                c0: Fp2.add(Fp2.mul(Fp2.sub(t3, c0c0), _2n), t3), // 2 * (T3 - c0c0)  + T3
                c1: Fp2.add(Fp2.mul(Fp2.sub(t5, c0c1), _2n), t5), // 2 * (T5 - c0c1)  + T5
                c2: Fp2.add(Fp2.mul(Fp2.sub(t7, c0c2), _2n), t7),
            }), // 2 * (T7 - c0c2)  + T7
            c1: Fp6.create({
                c0: Fp2.add(Fp2.mul(Fp2.add(t9, c1c0), _2n), t9), // 2 * (T9 + c1c0) + T9
                c1: Fp2.add(Fp2.mul(Fp2.add(t4, c1c1), _2n), t4), // 2 * (T4 + c1c1) + T4
                c2: Fp2.add(Fp2.mul(Fp2.add(t6, c1c2), _2n), t6),
            }),
        } // 2 * (T6 + c1c2) + T6
    },
    Fp12cyclotomicExp(num, n) {
        let z = Fp12.ONE
        for (let i = BN_X_LEN - 1; i >= 0; i--) {
            z = Fp12._cyclotomicSquare(z)
            if (bitGet(n, i)) z = Fp12.mul(z, num)
        }
        return z
    },
    // https://eprint.iacr.org/2010/354.pdf
    // https://eprint.iacr.org/2009/565.pdf
    Fp12finalExponentiate: (num) => {
        const powMinusX = (num: Fp12) => Fp12.conjugate(Fp12._cyclotomicExp(num, BN_X))
        const r0 = Fp12.mul(Fp12.conjugate(num), Fp12.inv(num))
        const r = Fp12.mul(Fp12.frobeniusMap(r0, 2), r0)
        const y1 = Fp12._cyclotomicSquare(powMinusX(r))
        const y2 = Fp12.mul(Fp12._cyclotomicSquare(y1), y1)
        const y4 = powMinusX(y2)
        const y6 = powMinusX(Fp12._cyclotomicSquare(y4))
        const y8 = Fp12.mul(Fp12.mul(Fp12.conjugate(y6), y4), Fp12.conjugate(y2))
        const y9 = Fp12.mul(y8, y1)
        return Fp12.mul(
            Fp12.frobeniusMap(Fp12.mul(Fp12.conjugate(r), y9), 3),
            Fp12.mul(
                Fp12.frobeniusMap(y8, 2),
                Fp12.mul(Fp12.frobeniusMap(y9, 1), Fp12.mul(Fp12.mul(y8, y4), r)),
            ),
        )
    },
})

// END OF CURVE FIELDS
const { G2psi, psi } = psiFrobenius(Fp, Fp2, Fp2.NONRESIDUE)

function SVDWFpIsSquare<T>(Fp: mod.IField<T>) {
    // Compute the Legendre symbol to determine if `u` is a quadratic residue
    return (u: T) => {
        const x = Fp.pow(u, (Fp.ORDER - 1n) / 2n)
        let legendre: -1n | 0n | 1n
        if (Fp.eql(x, Fp.neg(Fp.ONE))) {
            legendre = -1n
        } else if (Fp.eql(x, Fp.ZERO)) {
            legendre = 0n
        } else if (Fp.eql(x, Fp.ONE)) {
            legendre = 1n
        } else {
            throw new Error('Legendre failed')
        }
        return legendre === 1n
    }
}

/**
 * Shallue-van de Woestijne (SVDW) map-to-curve ("straight-line" implementation)
 * https://datatracker.ietf.org/doc/html/rfc9380/#appendix-F.1
 */
export function mapToCurveSVDW<T>(
    Fp: mod.IField<T>,
    opts: {
        A: T
        B: T
        Z: T
    },
) {
    mod.validateField(Fp)
    if (!Fp.isValid(opts.A) || !Fp.isValid(opts.B) || !Fp.isValid(opts.Z))
        throw new Error('mapToCurveSimpleSVDW: invalid opts')
    const isSquare = SVDWFpIsSquare(Fp)
    if (!Fp.isOdd) throw new Error('Fp.isOdd is not implemented!')

    // g(x) is the short Weierstrass equation of the curve g(x) = x^3 + A*x + B
    const g = (x: T) => Fp.add(Fp.add(Fp.mul(Fp.mul(x, x), x), Fp.mul(opts.A, x)), opts.B)
    const two = Fp.add(Fp.ONE, Fp.ONE)
    const three = Fp.add(two, Fp.ONE)
    const four = Fp.add(three, Fp.ONE)
    // C1 = g(Z) where g(x) = x^3 + A*x + B
    const c1 = g(opts.Z)
    // C2 = -Z / 2
    const c2 = Fp.mul(Fp.neg(opts.Z), Fp.inv(Fp.add(Fp.ONE, Fp.ONE)))
    // C3 = sqrt(-g(Z) * (3 * Z^2 + 4 * A))
    const c3 = Fp.sqrt(
        Fp.mul(Fp.neg(c1), Fp.add(Fp.mul(three, Fp.mul(opts.Z, opts.Z)), Fp.mul(four, opts.A))),
    )
    // C4 = 4 * -g(Z) / (3 * Z^2 + 4 * A)
    const c4 = Fp.mul(
        Fp.mul(four, Fp.neg(c1)),
        Fp.inv(Fp.add(Fp.mul(three, Fp.mul(opts.Z, opts.Z)), Fp.mul(four, opts.A))),
    )
    // Input: u, an element of F.
    // Output: (x, y), a point on E.
    return (u: T): { x: T; y: T } => {
        // prettier-ignore
        let tv1, tv2, tv3, tv4, x1, gx1, e1, x2, gx2, e2, x3, x, gx, y, e3;
        tv1 = Fp.mul(u, u)
        tv1 = Fp.mul(tv1, c1)
        tv2 = Fp.add(Fp.ONE, tv1)
        tv1 = Fp.sub(Fp.ONE, tv1)
        tv3 = Fp.mul(tv1, tv2)
        tv3 = Fp.inv(tv3)
        tv4 = Fp.mul(u, tv1)
        tv4 = Fp.mul(tv4, tv3)
        tv4 = Fp.mul(tv4, c3)
        x1 = Fp.sub(c2, tv4)
        gx1 = Fp.mul(x1, x1)
        gx1 = Fp.add(gx1, opts.A)
        gx1 = Fp.mul(gx1, x1)
        gx1 = Fp.add(gx1, opts.B)
        e1 = isSquare(gx1)
        x2 = Fp.add(c2, tv4)
        gx2 = Fp.mul(x2, x2)
        gx2 = Fp.add(gx2, opts.A)
        gx2 = Fp.mul(gx2, x2)
        gx2 = Fp.add(gx2, opts.B)
        e2 = isSquare(gx2) && !e1
        x3 = Fp.mul(tv2, tv2)
        x3 = Fp.mul(x3, tv3)
        x3 = Fp.mul(x3, x3)
        x3 = Fp.mul(x3, c4)
        x3 = Fp.add(x3, opts.Z)
        x = Fp.cmov(x3, x1, !!e1)
        x = Fp.cmov(x, x2, !!e2)
        gx = Fp.mul(x, x)
        gx = Fp.add(gx, opts.A)
        gx = Fp.mul(gx, x)
        gx = Fp.add(gx, opts.B)
        y = Fp.sqrt(gx)
        e3 = Fp.isOdd!(u) === Fp.isOdd!(y)
        y = Fp.cmov(Fp.neg(y), y, e3)
        return { x, y }
    }
}

const G1_SVDW = mapToCurveSVDW(Fp, {
    A: Fp.ZERO,
    B: _3n,
    Z: Fp.ONE,
})

const mapToCurveG1 = (scalars: bigint[]) => G1_SVDW(scalars[0])

/*
Hash-to-curve & signatures implemented to drand evmnet specs.
- Uses SVDW, test vectors generated using Sage reference implementation
- Signatures on G1 only
- No support for compressed points
- Uses keccak256 for hashing
*/
const drandHtf = Object.freeze({
    // DST: a domain separation tag
    // defined in section 2.2.5
    // Use utils.getDSTLabel(), utils.setDSTLabel(value)
    DST: 'BLS_SIG_BN254G1_XMD:KECCAK-256_SVDW_RO_NUL_',
    encodeDST: 'BLS_SIG_BN254G1_XMD:KECCAK-256_SVDW_RO_NUL_',
    // p: the characteristic of F
    //    where F is a finite field of characteristic p and order q = p^m
    p: Fp.ORDER,
    // m: the extension degree of F, m >= 1
    //     where F is a finite field of characteristic p and order q = p^m
    m: 1,
    // k: the target security level for the suite in bits
    // defined in section 5.1
    k: 128,
    // option to use a message that has already been processed by
    // expand_message_xmd
    expand: 'xmd',
    // NB: We use keccak_256 to hash-to-curve for bn254 drand, as it is the
    // cheapest hash function in the EVM.
    hash: keccak_256,
} as const)

/**
 * bn254 (a.k.a. alt_bn128) pairing-friendly curve.
 * Contains G1 / G2 operations and pairings.
 */
export const bn254: CurveFn = bls({
    // Fields
    fields: { Fp, Fp2, Fp6, Fp12, Fr },
    G1: {
        Fp,
        h: BigInt(1),
        Gx: BigInt(1),
        Gy: BigInt(2),
        a: Fp.ZERO,
        b: _3n,
        htfDefaults: { ...drandHtf, m: 1, DST: 'BN254G2_XMD:SHA-256_SVDW_RO_' },
        wrapPrivateKey: true,
        allowInfinityPoint: true,
        mapToCurve: mapToCurveG1,
        fromBytes: (bytes: Uint8Array): AffinePoint<Fp> => {
            // Deserialise from Kyber format
            const p = [bytes.slice(0, 32), bytes.slice(32, 64)].map((buf) => bytesToNumberBE(buf))
            const point = { x: Fp.create(p[0]), y: Fp.create(p[1]) }
            bn254.G1.ProjectivePoint.fromAffine(point).assertValidity()
            return point
        },
        toBytes: (c, point, _isCompressed) => {
            // Serialise to Kyber format
            const isZero = point.equals(c.ZERO)
            const { x, y } = point.toAffine()
            const { BYTES: len } = Fp
            if (isZero) {
                return new Uint8Array(len)
            }
            return concatB(numberToBytesBE(x, len), numberToBytesBE(y, len))
        },
        ShortSignature: {
            fromHex(hex: Hex): ProjPointType<Fp> {
                return bn254.G1.ProjectivePoint.fromHex(hex)
            },
            toRawBytes(point: ProjPointType<Fp>) {
                return point.toRawBytes()
            },
            toHex(point: ProjPointType<Fp>) {
                return point.toHex()
            },
        },
    },
    G2: {
        Fp: Fp2,
        // cofactor: (36 * X^4) + (36 * X^3) + (30 * X^2) + 6*X + 1
        h: BigInt('21888242871839275222246405745257275088844257914179612981679871602714643921549'),
        Gx: Fp2.fromBigTuple([
            BigInt('10857046999023057135944570762232829481370756359578518086990519993285655852781'),
            BigInt('11559732032986387107991004021392285783925812861821192530917403151452391805634'),
        ]),
        Gy: Fp2.fromBigTuple([
            BigInt('8495653923123431417604973247489272438418190587263600148770280649306958101930'),
            BigInt('4082367875863433681332203403145435568316851327593401208105741076214120093531'),
        ]),
        a: Fp2.ZERO,
        b: Fp2B,
        hEff: BigInt(
            '21888242871839275222246405745257275088844257914179612981679871602714643921549',
        ),
        htfDefaults: { ...drandHtf, m: 2 },
        wrapPrivateKey: true,
        allowInfinityPoint: true,
        isTorsionFree: (c, P) => P.multiplyUnsafe(SIX_X_SQUARED).equals(G2psi(c, P)), // [p]P = [6X^2]P
        mapToCurve: notImplemented,
        fromBytes: (bytes: Uint8Array): AffinePoint<Fp2> => {
            // Deserialise from Kyber format
            const p = [
                bytes.slice(32, 64),
                bytes.slice(0, 32),
                bytes.slice(96, 128),
                bytes.slice(64, 96),
            ].map((buf) => bytesToNumberBE(buf))
            const x = Fp2.create({ c0: p[0], c1: p[1] })
            const y = Fp2.create({ c0: p[2], c1: p[3] })
            bn254.G2.ProjectivePoint.fromAffine({ x, y }).assertValidity()
            return { x, y }
        },
        toBytes: (c, point, _isCompressed) => {
            // Serialise to Kyber format. No point compression.
            // https://github.com/drand/kyber/blob/master/pairing/bn254/point.go#L415
            const { BYTES: len } = Fp
            const isZero = point.equals(c.ZERO)
            const { x, y } = point.toAffine()

            const marshalSize = 4 * len
            if (isZero) {
                // Kyber returns zero bytes for point at infinity
                return new Uint8Array(marshalSize)
            }

            // Kyber format is x = b + ai
            const { re: x0, im: x1 } = Fp2.reim(x)
            const { re: y0, im: y1 } = Fp2.reim(y)
            return concatB(
                numberToBytesBE(x1, len),
                numberToBytesBE(x0, len),
                numberToBytesBE(y1, len),
                numberToBytesBE(y0, len),
            )
        },
        Signature: {
            fromHex: notImplemented,
            toRawBytes: notImplemented,
            toHex: notImplemented,
        },
    },
    params: {
        ateLoopSize: BN_X * _6n + _2n,
        r: Fr.ORDER,
        xNegative: false,
        twistType: 'divisive',
    },
    htfDefaults: drandHtf,
    hash: keccak_256,
    randomBytes,

    postPrecompute: (Rx, Ry, Rz, Qx, Qy, pointAdd) => {
        const q = psi(Qx, Qy)
        ;({ Rx, Ry, Rz } = pointAdd(Rx, Ry, Rz, q[0], q[1]))
        const q2 = psi(q[0], q[1])
        pointAdd(Rx, Ry, Rz, q2[0], Fp2.neg(q2[1]))
    },
})
