import Chain from './chain.js'
import { AbortError, controllerWithParent } from './abort.js'

/**
 * A mock client for testing.
 *
 * @param [options] {object}
 * @param [options.beacons] {[]object} beacons to use in watch and get note that
 * only using watch will progress the latest beacon. Each beacon object in the
 * array can optionally have a `delay` property which will cause it to be
 * delayed before being returned/yielded by get/watch.
 * @param [options.latestBeaconIndex] {number} Index in `options.beacon` of the
 * latest beacon.
 * @param [options.chainInfo] {object} The chain info
 */
export default class Mock {
  constructor (options) {
    this._options = options || {}
    this._beaconIndex = 0 || this._options.latestBeaconIndex
    this._controllers = []
  }

  async get (round, options) {
    options = options || {}
    const beacons = this._options.beacons || []
    const beacon = round
      ? beacons.find(b => b.round === round)
      : beacons[this._beaconIndex]
    if (!beacon) throw new Error('not found')

    const controller = controllerWithParent(options.signal)
    this._controllers.push(controller)

    try {
      await waitOrAbort(beacon.delay || 0, controller.signal)
    } finally {
      this._controllers = this._controllers.filter(c => c !== controller)
      controller.abort()
    }

    return beacon
  }

  info () {
    const { chainInfo } = this._options
    if (!chainInfo) throw new Error('no chain info passed to constructor')
    return chainInfo
  }

  async * watch (options) {
    options = options || {}
    const { chainInfo } = this._options
    if (!chainInfo) throw new Error('watch needs to know period from missing chain info')

    const controller = controllerWithParent(options.signal)
    this._controllers.push(controller)

    const beacons = this._options.beacons || []

    try {
      while (true) {
        const beacon = beacons[this._beaconIndex]
        if (!beacon) throw new Error(`no beacon at index ${this._beaconIndex}`)
        await waitOrAbort(beacon.delay || 0, controller.signal)
        yield beacon
        this._beaconIndex++
        await waitOrAbort(chainInfo.period * 1000, controller.signal)
      }
    } finally {
      this._controllers = this._controllers.filter(c => c !== controller)
      controller.abort()
    }
  }

  roundAt (time) {
    const { chainInfo } = this._options
    if (!chainInfo) throw new Error('roundAt needs genesis and period from missing chain info')
    return Chain.roundAt(time, chainInfo.genesis_time * 1000, chainInfo.period * 1000)
  }

  close () {
    this._controllers.forEach(c => c.abort())
    this._controllers = []
  }
}

function waitOrAbort (duration, signal) {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new AbortError())
    const timeoutID = setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolve()
    }, duration)
    const onAbort = () => {
      clearTimeout(timeoutID)
      reject(new AbortError())
    }
    signal.addEventListener('abort', onAbort)
  })
}
