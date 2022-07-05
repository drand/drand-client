/* eslint-env browser */

const SPEED_TEST_INTERVAL = 1000 * 60 * 5

export default class Optimizing {
  // TODO: options for default request timeout and concurrency
  constructor (clients, options) {
    this._clients = clients
    this._stats = clients.map(c => ({ client: c, rtt: 0, startTime: Date.now() }))
    this._options = options || {}
    this._options.speedTestInterval = this._options.speedTestInterval || SPEED_TEST_INTERVAL
  }

  start () {
    if (this._options.speedTestInterval > 0) {
      return this._testSpeed()
    }
  }

  _testSpeed () {
    const run = async () => {
      const stats = await Promise.all(this._clients.map(async c => {
        try {
          const res = await this._get(c, 1, { noCache: true })
          return res.stat
        } catch (_) {
          // An abort happened
        }
      }))
      this._updateStats(stats.filter(Boolean))
    }
    this._speedTestIntervalID = setInterval(run, this._options.speedTestInterval)
    return run()
  }

  _fastestClients () {
    return this._stats.map(s => s.client)
  }

  _updateStats (stats) {
    for (const next of stats) {
      for (const curr of this._stats) {
        if (curr.client === next.client) {
          if (curr.startTime <= next.startTime) {
            curr.rtt = next.rtt
            curr.startTime = next.startTime
          }
          break
        }
      }
    }
    this._stats.sort((a, b) => a.rtt - b.rtt)
  }

  async get (round, options) {
    const stats = []
    try {
      let res
      // TODO: race with concurrency
      for (const client of this._fastestClients()) {
        res = await this._get(client, round, options)
        stats.push(res.stat)
        if (!res.error) {
          return res.rand
        }
      }
      throw res.error
    } finally {
      this._updateStats(stats)
    }
  }

  // _get performs get on the passed client, recording a request stat. If an
  // error occurs that is not an abort error then a result will still be
  // returned with an error property.
  async _get (client, round, options) {
    const startTime = Date.now()
    try {
      const rand = await client.get(round, options)
      return { rand, stat: { client, rtt: Date.now() - startTime, startTime } }
    } catch (err) {
      // client failure, set a large RTT so it is sent to the back of the list
      if (err.name !== 'AbortError') {
        return { error: err, stat: { client, rtt: Number.MAX_SAFE_INTEGER, startTime } }
      }
      throw err
    }
  }

  async * watch (options) {
    // TODO: watch and race all clients
    const client = this._fastestClients()[0]
    yield * client.watch(options)
  }

  async info (options) {
    for (const client of this._clients) {
      try {
        const info = await client.info(options)
        return info
      } catch (err) {
        if (client === this._clients[this._clients.length - 1]) {
          throw err
        }
      }
    }
  }

  roundAt (time) {
    return this._clients[0].roundAt(time)
  }

  async close () {
    clearInterval(this._speedTestIntervalID)
    return Promise.all(this._clients.map(c => c.close()))
  }
}
