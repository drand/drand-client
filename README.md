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

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Install

In the browser or [Deno](https://deno.land) you can grab and use the client from a CDN
e.g. https://cdn.jsdelivr.net/npm/drand-client/drand.js.

In [Node.js](https://nodejs.org), install with:

```sh
npm install drand-client
```

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
        // (note: it's verifiable, so you don't need to worry about malicious providers as long as you fill in the 
        // `chainVerificationParams` in the options!)
        const urls = [
            'https://api.drand.sh',
            'https://drand.cloudflare.com'
            // ...
        ]
        const fastestNodeClient = new FastestNodeClient(urls, options)
        // don't forget to start it!
        fastestNodeClient.start()
        const theLatestBeaconFromTheFastestClient = await fetchBeacon(fastestNodeClient)
        // don't forget to stop the speed testing!
        fastestNodeClient.stop()

        // you can also use an async generator to watch the latest randomness automatically!
        // use an abort controller to stop it
        const abortController = new AbortController()
        for await (const beacon of watch(client, abortController)) {
            if (beacon.round === 10) {
                abortController.abort('round 10 reached')
            }
        }

        // finally you can also interact with multibeacon nodes by using the `MultiBeaconNode` class
        const multiBeaconNode = new MultiBeaconNode('https://api.drand.sh', options)
        const health = await multiBeaconNode.health()

        // you can monitor its health
        if (health.status === 200) {
            console.log(`Multibeacon node is healthy and has processed ${health.current} of ${health.expected} rounds`)
        }

        // and get the chains it follows
        const chains = await multiBeaconNode.chains()
        for (const c of chains) {
            const info = await c.info()
            console.log(`Chain with baseUrl ${c.baseUrl} has a genesis time of ${info.genesis_time}`)
        }

        // you can even create clients straight from the chains it returns
        const latestBeaconsFromAllChains = Promise.all(
                chains
                        .map(each => new HttpChainClient(each, options))
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

If you'd like to run it in Node.js, add [`fetch`](http://npm.im/node-fetch)
and [`AbortController`](http://npm.im/abort-controller) as globals e.g.

```js
import Client, { HTTP } from 'drand-client'
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
const { default: Client, HTTP } = await import('drand-client')

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
