import { AbortError, controllerWithParent } from './abort.js'

async function forNextRound (round, chainInfo, { signal }) {
  const time = (chainInfo.genesis_time * 1000) + ((round + 1) * (chainInfo.period * 1000))
  const delta = time - Date.now()
  if (delta <= 0) return
  return new Promise((resolve, reject) => {
    const timeoutID = setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolve()
    }, delta)
    const onAbort = () => {
      clearTimeout(timeoutID)
      reject(new AbortError())
    }
    signal.addEventListener('abort', onAbort)
  })
}

export default class PollingWatcher {
  constructor (client, chainInfo) {
    this._client = client
    this._chainInfo = chainInfo
    this._controllers = []
  }

  async * Watch (options) {
    options = options || {}

    const controller = controllerWithParent(options.signal)
    this._controllers.push(controller)

    try {
      let round, rand
      round = this._client.roundAt(Date.now())
      rand = await this._client.get(round, { signal: controller.signal })
      yield rand

      while (true) {
        round = this._client.roundAt(Date.now())
        await forNextRound(round, this._chainInfo, { signal: controller.signal })
        rand = await this._client.get(round + 1, { signal: controller.signal })
        yield rand
      }
    } finally {
      this._controllers = this._controllers.filter(c => c !== controller)
      controller.abort()
    }
  }

  close () {
    this._controllers.forEach(c => c.abort())
    this._controllers = []
  }
}
