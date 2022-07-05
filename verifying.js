import { verifyBeacon } from './beacon-verification.js'

export default class Verifying {
  constructor (client, options) {
    this._client = client
    this._options = options || {}
  }

  async get (round, options) {
    options = options || {}
    const rand = await this._client.get(round, options)
    return this._verify(rand, { signal: options.signal })
  }

  info (options) {
    return this._client.info(options)
  }

  async * watch (options) {
    options = options || {}
    for await (let rand of this._client.watch(options)) {
      rand = await this._verify(rand, { signal: options.signal })
      yield rand
    }
  }

  roundAt (time) {
    return this._client.roundAt(time)
  }

  async _verify (rand, options) {
    // TODO: full/partial chain verification
    const info = await this.info(options)
    const beaconValid = await verifyBeacon(info.public_key, rand)
    if (!beaconValid) {
      throw Error(`Round ${rand.round} beacon signature was not valid!!`)
    }
    // TODO: derive the randomness from the signature
    return { ...rand }
  }

  async close () {
    return this._client.close()
  }
}
