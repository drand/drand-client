import * as bls from '@noble/bls12-381'

async function verifyBeacon (publicKey, beacon) {
  const previousSigAndRound = Buffer.concat([
    signatureBuffer(beacon.previous_signature),
    roundBuffer(beacon.round)
  ])
  const message = await bls.utils.sha256(previousSigAndRound)
  return bls.verify(beacon.signature, message, publicKey)
}

function signatureBuffer (sig) {
  return Buffer.from(sig, 'hex')
}

function roundBuffer (round) {
  const buffer = Buffer.alloc(8)
  buffer.writeBigUInt64BE(BigInt(round))
  return buffer
}

export { verifyBeacon, roundBuffer }
