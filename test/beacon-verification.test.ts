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
        const beacon = {
            round: 19369534,
            randomness: '778180564f4fb9b77580af69a559ce941eb23d8d3180c48c4d290484b516c6aa',
            signature: 'a33833d2098f5e0c4df334fb6c5b1c2de3ab293c77825f55d816254dabf7f4f3d429b6207e1cd2a808876e06058a1f8102bb6f6927b654b391259ea99c3566a4eb55feb9665dbaf9d33af08a10b1d8d8b35d91fd3536eb4c197be0041beb5dc2'
        }
        const chainInfo = createChainInfo(
            '8200fc249deb0148eb918d6e213980c5d01acd7fc251900d9260136da3b54836ce125172399ddc69c4e3e11429b62c11',
            'pedersen-bls-unchained'
        )

        expect(await verifyBeacon(chainInfo, beacon, beacon.round)).toBeTruthy()
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

        expect(await verifyBeacon(chainInfo, beacon, beacon.round)).toBeFalsy()
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

        expect(await verifyBeacon(chainInfo, beacon, beacon.round)).toBeTruthy()
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

        expect(await verifyBeacon(chainInfo, beacon, beacon.round)).toBeFalsy()
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

        expect(await verifyBeacon(chainInfo, beacon, beacon.round)).toBeFalsy()
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

        expect(await verifyBeacon(chainInfo, beacon, beacon.round)).toBeFalsy()
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

        expect(await verifyBeacon(chainInfo, beacon, beacon.round)).toBeFalsy()
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

        expect(await verifyBeacon(chainInfo, beacon, beacon.round)).toBeFalsy()
    })
    describe('signatures on G1 with DST', () => {
        const validBeacon = {
            round: 38,
            randomness: 'b2fc21325a24904a6a9e81a6c63f65f6cec3f0b2400df3f4a56b214770e9ccca',
            signature: '95c93585c513ebbcb4777ff15599b3140e5ec0295faa0e483f3deadd88fa6d43f0d3703e3a4ce106e8fd6c6987f32126'
        }

        const chainInfo = {
            public_key: '81d320f220ee9c79e60e19dedc838c31e3ab919b15481e9feb52f643628c4f6a13fdc52129493875a818109d767272ca0541cbcdcea9335f2870d781b39b845ba8cbd44fdfe4967781cf72ca5917fc9398bcf97ca0548ed5a709016c4b1ff0f3',
            period: 3,
            genesis_time: 1687506816,
            hash: 'af8b6fc95693b058a3a59efe586eb31c2c352fe00cf40c62a427d87c34f7a235',
            groupHash: '02d678e93908888871b70e3f015b396a8c082bc1493ae5479f8743cb5d972b54',
            schemeID: 'bls-unchained-g1-rfc9380',
            metadata: {'beaconID': 'walkthrough'}
        }

        it('should verify a valid signature', async () => {
            await expect(verifyBeacon(chainInfo, validBeacon, validBeacon.round)).resolves.toEqual(true)
        })
        it('should not verify a signature on G1 for the wrong round', async () => {
            const invalidBeacon = {...validBeacon, round: 55}
            await expect(verifyBeacon(chainInfo, invalidBeacon, invalidBeacon.round)).resolves.toEqual(false)
        })
        it('should not verify a valid beacon with the wrong expected round', async () => {
            await expect(verifyBeacon(chainInfo, validBeacon, 2)).resolves.toEqual(false)
        })
    })

    describe('signatures on BN254 G1', () => {
        const validBeacon = {
            round: 6390578,
            signature:
                '0d0d705983f50d6a2846e77d8d12a238f0be277a2307eb3e0d5206dc6765b0f91f04e596e3b28295086e8fda9047d40d37f7c2d8fb2f6686839101692e4f5f13',
            randomness: '466262e8cb50407310fa05024bff96e52a8c701e7f6b209ac5cdbdf01cf903f2',
        }

        const chainInfo = {
            public_key: '07e1d1d335df83fa98462005690372c643340060d205306a9aa8106b6bd0b3820557ec32c2ad488e4d4f6008f89a346f18492092ccc0d594610de2732c8b808f0095685ae3a85ba243747b1b2f426049010f6b73a0cf1d389351d5aaaa1047f6297d3a4f9749b33eb2d904c9d9ebf17224150ddd7abd7567a9bec6c74480ee0b',
            period: 3,
            genesis_time: 1727521075,
            hash: '04f1e9062b8a81f848fded9c12306733282b2727ecced50032187751166ec8c3',
            groupHash: 'cd7ad2f0e0cce5d8c288f2dd016ffe7bc8dc88dbb229b3da2b6ad736490dfed6',
            schemeID: 'bls-bn254-unchained-on-g1',
            metadata: {
                beaconID: 'evmnet'
            }
        }

        it('should verify a valid signature', async () => {
            await expect(verifyBeacon(chainInfo, validBeacon, validBeacon.round)).resolves.toEqual(true)
        })
    })
})
