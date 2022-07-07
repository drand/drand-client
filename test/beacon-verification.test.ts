import { roundBuffer } from '../lib/beacon-verification'

test('round buffer converts numbers < 255 correctly', async () => {
  expect(roundBuffer(1).readBigUInt64BE()).toBe(BigInt(1))
})

test('round buffer converts numbers > 255 correctly', async () => {
  expect(roundBuffer(256).readBigUInt64BE()).toBe(BigInt(256))
})

test('round buffer converts max safe int correctly', async () => {
  expect(roundBuffer(Number.MAX_SAFE_INTEGER).readBigUInt64BE()).toBe(BigInt(Number.MAX_SAFE_INTEGER))
})

test.skip(
  'round buffer fails to convert unsafe round counts correctly',
  async () => {
    expect(roundBuffer(Number.MAX_VALUE).readBigUInt64BE()).toBe(BigInt(Number.MAX_VALUE))
  }
)
