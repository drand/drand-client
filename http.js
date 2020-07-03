/* eslint-env browser */

import * as AbortFactory from './abort-factory.js'
import PollingWatcher from './polling-watcher.js'

export default class HTTP {
  constructor (url, chainInfo, options) {
    this._url = url
    this._chainInfo = chainInfo
    this._options = options || {}
    this._controllers = []
    this._watcher = new PollingWatcher(this, chainInfo)
  }

  async get (round, options) {
    options = options || {}

    if (typeof round === 'object') {
      options = round
      round = 0
    }

    const controller = AbortFactory.withParent(options.signal)
    this._controllers.push(controller)

    try {
      const url = `${this._url}/public/${round || 'latest'}`
      const res = await fetch(url, { signal: controller.signal })
      if (!res.ok) throw new Error(`unexpected HTTP status ${res.status} for URL ${url}`)
      const rand = await res.json()
      return rand
    } finally {
      this._controllers = this._controllers.filter(c => c !== controller)
      controller.abort()
    }
  }

  async info () {
    return this._chainInfo
  }

  static async info (url, chainHash, options) {
    options = options || {}
    const res = await fetch(`${url}/info`, { signal: options.signal })
    if (!res.ok) throw new Error(`unexpected HTTP status ${res.status} for URL ${url}/info`)
    const info = await res.json()
    // TODO: verify chain hash
    return info
  }

  async * watch (options) {
    yield * this._watcher.Watch(options)
  }

  roundAt (time) {
    return Math.floor((time - (this._chainInfo.genesis_time * 1000)) / (this._chainInfo.period * 1000))
  }

  async close () {
    this._controllers.forEach(c => c.abort())
    this._controllers = []
    await this._watcher.close()
  }

  static async forURLs (urls, chainHash) {
    let chainInfo
    for (const url of urls) {
      try {
        chainInfo = await HTTP.info(url, chainHash)
        break
      } catch (err) {
        if (url === urls[urls.length - 1]) {
          throw err
        }
      }
    }
    return urls.map(url => new HTTP(url, chainInfo))
  }
}
