# drand client

<p align="center"><img src="logo.png" width="220" /></p>

<p align="center">
  <a href="https://david-dm.org/drand/drand-client" title="dependencies Status"><img src="https://david-dm.org/drand/drand-client/status.svg" /></a>
  <a href="https://standardjs.com" title="JavaScript Style Guide"><img src="https://img.shields.io/badge/code_style-standard-brightgreen.svg" /></a>
</p>

<p align="center">A JavaScript <strong>client</strong> to the drand randomness beacon network.</p>

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

## Table of Contents

- [Install](#install)
- [Usage](#usage)
    - [Browser](#browser)
    - [Deno](#deno)
    - [Node.js](#nodejs)
- [Contribute](#contribute)
- [License](#license)
- [Limitations](#limitations)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Install

In the browser or [Deno](https://deno.land) you can grab and use the client from a CDN
e.g. https://cdn.jsdelivr.net/npm/drand-client/index.js.

In [Node.js](https://nodejs.org) or when using a bundler, install with:

```sh
npm install drand-client
```

Typescript types are included and don't need installed separately.

## Usage

The `drand-client` contains HTTP implementations, but other transports can be supported by implementing the `DrandNode`
, `Chain` and `ChainClient` interfaces where appropriate.

### Browser

```html

<script type='module'>
    import { 
      fetchBeacon, 
      fetchBeaconByTime, 
      HttpChainClient, 
      watch, 
      HttpCachingChain, 
      FastestNodeClient, 
      MultiBeaconNode 
    } from 'https://cdn.jsdelivr.net/npm/drand-client'

    const chainHash = '8990e7a9aaed2ffed73dbd7092123d6f289930540d7651336225dc172e51b2ce' // (hex encoded)
    const publicKey = '868f005eb8e6e4ca0a47c8a77ceaa5309a47978a7c71bc5cce96366b5d7a569937c529eeda66c7293784a9402801af31' // (hex encoded)

    async function main () {
        const options = {
            disableBeaconVerification: false, // `true` disables checking of signatures on beacons - faster but insecure!!!
            noCache: false, // `true` disables caching when retrieving beacons for some providers
            chainVerificationParams: { chainHash, publicKey }  // these are optional, but recommended! They are compared for parity against the `/info` output of a given node
        }

        // if you want to connect to a single chain to grab the latest beacon you can simply do the following
        const chain = new HttpCachingChain('https://api.drand.sh', options)
        const client = new HttpChainClient(chain, options)
        const theLatestBeacon = await fetchBeacon(client)

        // alternatively you can also get the beacon for a given time
        const theBeaconRightNow = await fetchBeaconByTime(client, Date.now())

        // if you're happy to get randomness from many APIs and automatically use the fastest
        // you can construct a `FastestNodeClient` with multiple URLs
        // note: the randomness beacons are cryptographically verifiable, so as long as you fill
        // in the `chainVerificationParams` in the options, you don't need to worry about malicious 
        // providers sending you fake randomness!
        const urls = [
            'https://api.drand.sh',
            'https://drand.cloudflare.com'
            // ...
        ]
        const fastestNodeClient = new FastestNodeClient(urls, options)
        // don't forget to start the client, or it won't periodically optimise for the fastest node!
        fastestNodeClient.start()
      
        const theLatestBeaconFromTheFastestClient = await fetchBeacon(fastestNodeClient)
      
        // don't forget to stop the speed testing, or you may leak a `setInterval` call!
        fastestNodeClient.stop()

        // you can also use the `watch` async generator to watch the latest randomness automatically!
        // use an abort controller to stop it
        const abortController = new AbortController()
        for await (const beacon of watch(client, abortController)) {
            if (beacon.round === 10) {
                abortController.abort('round 10 reached - listening stopped')
            }
        }

        // finally you can interact with multibeacon nodes by using the `MultiBeaconNode` class
        // prior to drand 1.4, each node could only follow and contribute to a single beacon chain 
        // - now nodes can contribute to many at once
        const multiBeaconNode = new MultiBeaconNode('https://api.drand.sh', options)

        // you can monitor its health
        const health = await multiBeaconNode.health()
        if (health.status === 200) {
            console.log(`Multibeacon node is healthy and has processed ${health.current} of ${health.expected} rounds`)
        }

        // get the chains it follows
        const chains = await multiBeaconNode.chains()
        for (const c of chains) {
            const info = await c.info()
            console.log(`Chain with baseUrl ${c.baseUrl} has a genesis time of ${info.genesis_time}`)
        }

        // and even create clients straight from the chains it returns
        const latestBeaconsFromAllChains = Promise.all(
                chains.map(chain => new HttpChainClient(chain, options))
                      .map(client => fetchBeacon(client))
        )
    }

    main()
</script>
```

### Deno

Usage in Deno is the same as the [browser](#browser), minus the HTML `<script>` tag. Ensure you run your script with
the `--allow-net` flag e.g. `deno run --allow-net client.js`.

### Node.js

If you'd like to run it in Node.js, add a fetch polyfill such as [`node-fetch`](http://npm.im/node-fetch)
and [`AbortController`](http://npm.im/abort-controller) as globals e.g.

```js
import fetch from 'node-fetch'
import AbortController from 'abort-controller'

global.fetch = fetch
global.AbortController = AbortController

// Use as per browser example...
```

**From common.js:**

```js
const fetch = require('node-fetch')
const AbortController = require('abort-controller')

global.fetch = fetch
global.AbortController = AbortController

// Use as per browser example...
```
## Publishing

This repo automatically publishes to npmjs.com as [drand-client](https://www.npmjs.com/package/drand-client) if changes
hit the master branch with an updated version number.

## Contribute

Feel free to dive in! [Open an issue](https://github.com/drand/drand-client/issues/new) or submit PRs.

## License

This project is dual-licensed under Apache 2.0 and MIT terms:

- Apache License, Version 2.0, ([LICENSE-APACHE](https://github.com/drand/drand-client/blob/master/LICENSE-APACHE)
  or http://www.apache.org/licenses/LICENSE-2.0)
- MIT license ([LICENSE-MIT](https://github.com/drand/drand-client/blob/master/LICENSE-MIT)
  or http://opensource.org/licenses/MIT)

## Limitations
-  relays exposing only the default endpoints and not the chain-hash-based ones are not supported