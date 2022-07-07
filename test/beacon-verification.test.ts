import test from 'ava'
import { roundBuffer } from '../lib/beacon-verification'

test('round buffer converts numbers < 255 correctly', async t => {
  t.is(roundBuffer(1).readBigUInt64BE(), BigInt(1))
})

test('round buffer converts numbers > 255 correctly', async t => {
  t.is(roundBuffer(256).readBigUInt64BE(), BigInt(256))
})

test('round buffer converts max safe int correctly', async t => {
  t.is(roundBuffer(Number.MAX_SAFE_INTEGER).readBigUInt64BE(), BigInt(Number.MAX_SAFE_INTEGER))
})

test.failing('round buffer fails to convert unsafe round counts correctly', async t => {
  t.is(roundBuffer(Number.MAX_VALUE).readBigUInt64BE(), BigInt(Number.MAX_VALUE))
})
