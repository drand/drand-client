import {roundBuffer, verifyBeacon} from '../lib/beacon-verification'

test('round buffer converts numbers < 255 correctly', async () => {
    expect(roundBuffer(1).readBigUInt64BE()).toBe(BigInt(1))
})

test('round buffer converts numbers > 255 correctly', async () => {
    expect(roundBuffer(256).readBigUInt64BE()).toBe(BigInt(256))
})

test('round buffer converts max safe int correctly', async () => {
    expect(roundBuffer(Number.MAX_SAFE_INTEGER).readBigUInt64BE()).toBe(BigInt(Number.MAX_SAFE_INTEGER))
})

// this is a limitation of the prior pure JS client too, leaving this test in as a demonstration of that
test.skip('round buffer fails to convert unsafe round counts correctly', async () => {
    expect(roundBuffer(Number.MAX_VALUE).readBigUInt64BE()).toBe(BigInt(Number.MAX_VALUE))
})

describe('verifyBeacon', () => {
    const createChainInfo = (publicKey: string, schemeId: string) => ({
        public_key: publicKey,
        period: 1,
        genesis_time: 0,
        hash: 'some hash',
        groupHash: 'deadbeef',
        schemeID: schemeId,
        metadata: {
            beaconID: 'default'
        }
    })
    it('should validate unchained beacons from the go codebase', async () => {
        const chainInfo = createChainInfo(
            '8d91ae0f4e3cd277cfc46aba26680232b0d5bb4444602cdb23442d62e17f43cdffb1104909e535430c10a6a1ce680a65',
            'pedersen-bls-unchained'
        )

        const beacon = {
            round: 397092,
            randomness: '7731783ab8118d7484d0e8e237f3023a4c7ef4532f35016f2e56e89a7570c796',
            signature: '94da96b5b985a22a3d99fa3051a42feb4da9218763f6c836fca3770292dbf4b01f5d378859a113960548d167eaa144250a2c8e34c51c5270152ac2bc7a52632236f746545e0fae52f69068c017745204240d19dae2b4d038cef3c6047fcd6539'
        }

        expect(await verifyBeacon(chainInfo, beacon)).toBeTruthy()
    })

    it('should not validate unchained beacons that are invalid', async () => {
        const chainInfo = createChainInfo(
            '8d91ae0f4e3cd277cfc46aba26680232b0d5bb4444602cdb23442d62e17f43cdffb1104909e535430c10a6a1ce680a65',
            'pedersen-bls-unchained'
        )

        // same as valid but with a different round number
        const beacon = {
            round: 397091,
            randomness: '7731783ab8118d7484d0e8e237f3023a4c7ef4532f35016f2e56e89a7570c796',
            signature: '94da96b5b985a22a3d99fa3051a42feb4da9218763f6c836fca3770292dbf4b01f5d378859a113960548d167eaa144250a2c8e34c51c5270152ac2bc7a52632236f746545e0fae52f69068c017745204240d19dae2b4d038cef3c6047fcd6539'
        }

        expect(await verifyBeacon(chainInfo, beacon)).toBeFalsy()
    })

    it('should validate chained beacon from the go codebase', async () => {
        const chainInfo = createChainInfo(
            '88a8227b75dba145599d894d33eebde3b36fef900d456ae2cc4388867adb4769c40359f783750a41b4d17e40f578bfdb',
            'pedersen-bls-chained'
        )
        const beacon = {
            round: 397089,
            randomness: 'cd435675735e459fb4d9c68a9d9f7b719e59e0a9f5f86fe6bd86b730d01fba42',
            signature: '88ccd9a91946bc0bbef2c6c60a09bbf4a247b1d2059522449aa1a35758feddfad85efe818bbde3e1e4ab0c852d96e65f0b1f97f239bf3fc918860ea846cbb500fcf7c9d0dd3d851320374460b5fc596b8cfd629f4c07c7507c259bf9beca850a',
            previous_signature: 'a2237ee39a1a6569cb8e02c6e979c07efe1f30be0ac501436bd325015f1cd6129dc56fd60efcdf9158d74ebfa34bfcbd17803dbca6d2ae8bc3a968e4dc582f8710c69de80b2e649663fef5742d22fff7d1619b75d5f222e8c9b8840bc2044bce'
        }

        expect(await verifyBeacon(chainInfo, beacon)).toBeTruthy()
    })

    it('should not validate chained beacon without a previous_signature', async () => {
        const chainInfo = createChainInfo(
            '88a8227b75dba145599d894d33eebde3b36fef900d456ae2cc4388867adb4769c40359f783750a41b4d17e40f578bfdb',
            'pedersen-bls-chained'
        )
        const beacon = {
            round: 397089,
            randomness: 'cd435675735e459fb4d9c68a9d9f7b719e59e0a9f5f86fe6bd86b730d01fba42',
            signature: '88ccd9a91946bc0bbef2c6c60a09bbf4a247b1d2059522449aa1a35758feddfad85efe818bbde3e1e4ab0c852d96e65f0b1f97f239bf3fc918860ea846cbb500fcf7c9d0dd3d851320374460b5fc596b8cfd629f4c07c7507c259bf9beca850a',
        }

        expect(await verifyBeacon(chainInfo, beacon)).toBeFalsy()
    })
    it('should not validate an invalid chained beacon', async () => {
        const chainInfo = createChainInfo(
            '88a8227b75dba145599d894d33eebde3b36fef900d456ae2cc4388867adb4769c40359f783750a41b4d17e40f578bfdb',
            'pedersen-bls-chained'
        )
        // same as the valid, but with a different round number
        const beacon = {
            round: 397088,
            randomness: 'cd435675735e459fb4d9c68a9d9f7b719e59e0a9f5f86fe6bd86b730d01fba42',
            signature: '88ccd9a91946bc0bbef2c6c60a09bbf4a247b1d2059522449aa1a35758feddfad85efe818bbde3e1e4ab0c852d96e65f0b1f97f239bf3fc918860ea846cbb500fcf7c9d0dd3d851320374460b5fc596b8cfd629f4c07c7507c259bf9beca850a',
            previous_signature: 'a2237ee39a1a6569cb8e02c6e979c07efe1f30be0ac501436bd325015f1cd6129dc56fd60efcdf9158d74ebfa34bfcbd17803dbca6d2ae8bc3a968e4dc582f8710c69de80b2e649663fef5742d22fff7d1619b75d5f222e8c9b8840bc2044bce'
        }

        expect(await verifyBeacon(chainInfo, beacon)).toBeFalsy()
    })

    it('should not validate an unchained beacon with a chained beacon scheme in ChainInfo ', async () => {
        // chained scheme
        const chainInfo = createChainInfo(
            '8d91ae0f4e3cd277cfc46aba26680232b0d5bb4444602cdb23442d62e17f43cdffb1104909e535430c10a6a1ce680a65',
            'pedersen-bls-chained'
        )

        // but an unchained beacon!
        const beacon = {
            round: 397092,
            randomness: '7731783ab8118d7484d0e8e237f3023a4c7ef4532f35016f2e56e89a7570c796',
            signature: '94da96b5b985a22a3d99fa3051a42feb4da9218763f6c836fca3770292dbf4b01f5d378859a113960548d167eaa144250a2c8e34c51c5270152ac2bc7a52632236f746545e0fae52f69068c017745204240d19dae2b4d038cef3c6047fcd6539'
        }

        expect(await verifyBeacon(chainInfo, beacon)).toBeFalsy()
    })
    it('should not validate a chained beacon with an unchained beacon scheme in ChainInfo', async () => {
        // unchained scheme
        const chainInfo = createChainInfo(
            '8d91ae0f4e3cd277cfc46aba26680232b0d5bb4444602cdb23442d62e17f43cdffb1104909e535430c10a6a1ce680a65',
            'pedersen-bls-unchained'
        )

        // but a chained beacon!
        const beacon = {
            round: 397092,
            randomness: '7731783ab8118d7484d0e8e237f3023a4c7ef4532f35016f2e56e89a7570c796',
            signature: '94da96b5b985a22a3d99fa3051a42feb4da9218763f6c836fca3770292dbf4b01f5d378859a113960548d167eaa144250a2c8e34c51c5270152ac2bc7a52632236f746545e0fae52f69068c017745204240d19dae2b4d038cef3c6047fcd6539',
            previous_signature: 'a2237ee39a1a6569cb8e02c6e979c07efe1f30be0ac501436bd325015f1cd6129dc56fd60efcdf9158d74ebfa34bfcbd17803dbca6d2ae8bc3a968e4dc582f8710c69de80b2e649663fef5742d22fff7d1619b75d5f222e8c9b8840bc2044bce'
        }

        expect(await verifyBeacon(chainInfo, beacon)).toBeFalsy()
    })

    it('should not validate if the randomness isnt what was signed', async () => {
        const chainInfo = createChainInfo(
            '8d91ae0f4e3cd277cfc46aba26680232b0d5bb4444602cdb23442d62e17f43cdffb1104909e535430c10a6a1ce680a65',
            'pedersen-bls-unchained'
        )

        const beacon = {
            round: 397092,
            randomness: 'deadbeefdeadbeef',
            signature: '94da96b5b985a22a3d99fa3051a42feb4da9218763f6c836fca3770292dbf4b01f5d378859a113960548d167eaa144250a2c8e34c51c5270152ac2bc7a52632236f746545e0fae52f69068c017745204240d19dae2b4d038cef3c6047fcd6539'
        }

        expect(await verifyBeacon(chainInfo, beacon)).toBeFalsy()
    })
    describe('signatures on G1', () => {
        const validBeacon = {
            round: 3,
            randomness: 'a4eb0ed6c4132da066843c3bfdce732ce5013eda86e74c136ab8ccc387b798dd',
            signature: '8176555f90d71aa49ceb37739683749491c2bab15a46094b255289ed25cf8f01cdfb1fe8bd9cd5a19eb09448a3e53186'
        }
        const chainInfo = {
            public_key: 'a0b862a7527fee3a731bcb59280ab6abd62d5c0b6ea03dc4ddf6612fdfc9d01f01c31542541771903475eb1ec6615f8d0df0b8b6dce385811d6dcf8cbefb8759e5e616a3dfd054c928940766d9a5b9db91e3b697e5d70a975181e007f87fca5e',
            period: 3,
            genesis_time: 1677685200,
            hash: 'dbd506d6ef76e5f386f41c651dcb808c5bcbd75471cc4eafa3f4df7ad4e4c493',
            groupHash: 'a81e9d63f614ccdb144b8ff79fbd4d5a2d22055c0bfe4ee9a8092003dab1c6c0',
            schemeID: 'bls-unchained-on-g1',
            metadata: {'beaconID': 'fastnet'}
        }

        it('should verify a signature on G1', async () => {
            await expect(verifyBeacon(chainInfo, validBeacon)).resolves.toEqual(true)
        })

        it('should not verify a signature on G1 for the wrong round', async () => {
            const invalidBeacon = {...validBeacon, round: 55}
            await expect(verifyBeacon(chainInfo, invalidBeacon)).resolves.toEqual(false)
        })
    })
})
