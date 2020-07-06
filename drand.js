import HTTP from './http.js'
import Optimizing from './optimizing.js'
import Verifying from './verifying.js'

async function wrap (clients, options) {
  clients = await Promise.resolve(clients)
  const cfg = options || {}
  cfg.clients = clients || []
  cfg.cacheSize = cfg.cacheSize || 32
  return makeClient(cfg)
}

async function makeClient (cfg) {
  if (!cfg.insecure && cfg.chainHash == null && cfg.chainInfo == null) {
    throw new Error('no root of trust specified')
  }
  if (cfg.clients.length === 0 && cfg.watcher == null) {
    throw new Error('no points of contact specified')
  }

  // TODO: watcher

  if (!cfg.disableBeaconVerification) {
    cfg.clients = cfg.clients.map(c => new Verifying(c))
  }

  const client = new Optimizing(cfg.clients)
  await client.start()

  // TODO: caching
  // TODO: aggregating

  return client
}

const Client = { wrap }

export default Client
export { HTTP }
