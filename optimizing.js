export default class Optimizing {
  // TODO: options with default request timeout, concurrency and speed test interval
  constructor (clients) {
    this._clients = clients
    // TODO: periodic speed test for clients
  }

  async start () {
    // TODO: start speed test
  }

  async get (round, options) {
    // TODO: race with concurrency
    for (const client of this._clients) {
      try {
        const rand = await client.get(round, options)
        return rand
      } catch (err) {
        if (client === this._clients[this._clients.length - 1]) {
          throw err
        }
      }
    }
  }

  async * watch (options) {
    // TODO: watch and race all clients
    const client = this._clients[Math.floor(Math.random() * this._clients.length)]
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
    return Promise.all(this._clients.map(c => c.close()))
  }
}
