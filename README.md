# drand client

<p align="center"><img src="logo.png" width="220" /></p>

<p align="center">
  <a href="https://travis-ci.org/drand/drand-client" title="Build Status"><img src="https://travis-ci.org/drand/drand-client.svg?branch=master" /></a>
  <a href="https://david-dm.org/drand/drand-client" title="dependencies Status"><img src="https://david-dm.org/drand/drand-client/status.svg" /></a>
  <a href="https://standardjs.com" title="JavaScript Style Guide"><img src="https://img.shields.io/badge/code_style-standard-brightgreen.svg" /></a>
</p>

<p align="center">A JavaScript <strong>client</strong> to the drand randomness beacon network.</p>

<p align="center">⚠️ This client does not yet support full/partial chain <em>verification</em>.</p>

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
## Table of Contents

- [Install](#install)
- [Usage](#usage)
  - [Browser](#browser)
  - [Deno](#deno)
  - [Node.js](#nodejs)
- [API](#api)
    - [`Client.wrap([]Client | Promise<[]Client>, options?: object): Promise<Client>`](#clientwrapclient--promiseclient-options-object-promiseclient)
    - [`client.get(round?: number, options?: object): Promise<object>`](#clientgetround-number-options-object-promiseobject)
    - [`client.info(options?: object): Promise<object>`](#clientinfooptions-object-promiseobject)
    - [`client.watch(options?: object): AsyncIterable<object>`](#clientwatchoptions-object-asynciterableobject)
    - [`client.roundAt(time): number`](#clientroundattime-number)
    - [`client.close(): Promise`](#clientclose-promise)
    - [`new HTTP(url: string, chainInfo: object, options?: object)`](#new-httpurl-string-chaininfo-object-options-object)
    - [`HTTP.forURLs([]string, chainHash): Promise<[]Client>`](#httpforurlsstring-chainhash-promiseclient)
- [Contribute](#contribute)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Install

In the browser or [Deno](https://deno.land) you can grab and use the client from a CDN e.g. https://cdn.jsdelivr.net/npm/drand-client/drand.js. In [Node.js](https://nodejs.org), install with `npm install drand-client`.

## Usage

The `drand-client` supports multiple transports, although only HTTP is available currently.

### Browser

```html
<script type="module">
import Client, { HTTP } from 'https://cdn.jsdelivr.net/npm/drand-client/drand.js'

const chainHash = '138a324aa6540f93d0dad002aa89454b1bec2b6e948682cde6bd4db40f4b7c9b' // (hex encoded)
const options = { chainHash }
const client = await Client.wrap(
  HTTP.forURLs(['http://drand.network'], chainHash),
  options
)
const res = await client.get() // gets the latest randomness round

console.log(res)
</script>
```

### Deno

Usage in Deno is the same as the [browser](#browser), minus the HTML `<script>` tag. Ensure you run your script with the the `--allow-net` flag e.g. `deno run --allow-net client.js`.

### Node.js

If you'd like to run it in Node.js, add [`fetch`](http://npm.im/node-fetch) and [`AbortController`](http://npm.im/abort-controller) as globals e.g.

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

## API

```js
import Client, { HTTP } from 'https://cdn.jsdelivr.net/npm/drand-client/drand.js'
```

#### `Client.wrap([]Client | Promise<[]Client>, options?: object): Promise<Client>`

Wrap provides a single entrypoint for wrapping concrete client implementation(s) with configured aggregation, caching, and retry logic.

* `options.chainHash: string` - hex encoded hash of the chain information, it uniquely identifies the drand chain. It is used as a root of trust for validation of the first round of randomness.
* `options.chainInfo: object` - the chain information, as returned by the `/info` JSON HTTP API endpoint. Can be passed instead of `options.chainHash`.
* `options.disableBeaconVerification: boolean` - disables verification of randomness beacons as they arrive (not recommended). Note that verification is performed by a compiled WASM module which is loaded on demand (default: `false`).
* `options.insecure: boolean` - indicate the client should be allowed to provide randomness when the root of trust is not fully provided in a validate-able way (default: `false`).

Note: When using the client you _should_ use the `chainHash` or `chainInfo` option in order for your client to validate the randomness it receives is from the correct chain. You may use the `insecure` option to bypass this validation but it is _not recommended_!

e.g.

```js
const client = await Client.wrap([/* ... */], options)
```

#### `client.get(round?: number, options?: object): Promise<object>`

Returns the randomness at `round` or an error. Requesting round = 0 will return randomness for the most recent known round, bounded at minimum to `client.roundAt(Date.now())`.

* `options.noCache: boolean` - bypass the cache.
* `options.signal: AbortSignal` - a signal obtained from an [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) that can be used to abort the request.

e.g.

```js
const round = 1
const res = await client.get(round)
/*
{
  "round": 367,
  "signature": "b62dd642e939191af1f9e15bef0f0b0e9562a5f570a12a231864afe468377e2a6424a92ccfc34ef1471cbd58c37c6b020cf75ce9446d2aa1252a090250b2b1441f8a2a0d22208dcc09332eaa0143c4a508be13de63978dbed273e3b9813130d5",
  "previous_signature": "afc545efb57f591dbdf833c339b3369f569566a93e49578db46b6586299422483b7a2d595814046e2847494b401650a0050981e716e531b6f4b620909c2bf1476fd82cf788a110becbc77e55746a7cccd47fb171e8ae2eea2a22fcc6a512486d",
  "randomness": "d7aed3686bf2be657e6d38c20999831308ee6244b68c8825676db580e7e3bec6"
}
*/
```

#### `client.info(options?: object): Promise<object>`

Info returns the parameters of the chain this client is connected to. The public key, when it started, and how frequently it updates.

* `options.noCache: boolean` - bypass the cache.
* `options.signal: AbortSignal` - a signal obtained from an [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) that can be used to abort the request.

e.g.

```js
const info = await client.info()
/*
{
  "public_key": "aaddd53d2c92454b698c52495990162bc999778a32fd570dad2ef3de2915a5b397d80ec5508919e84cd10944955b7318",
  "period": 10,
  "genesis_time": 1592226590,
  "hash": "c599c267a0dd386606f7d6132da8327d57e1004760897c9dd4fb8495c29942b2"
}
*/
```

#### `client.watch(options?: object): AsyncIterable<object>`

Watch returns an async iterable that yields new randomness beacons as they become available.

* `options.signal: AbortSignal` - a signal obtained from an [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) that can be used to abort the request.

e.g.

```js
for await (const res of client.watch()) {
    console.log(res)
}
// See output example from .get
```

#### `client.roundAt(time): number`

Returns the round number for the passed time (in milliseconds from Unix epoch).

#### `client.close(): Promise`

Halts the client, any background processes it runs and any in-flight `get`, `watch` or `info` requests.

#### `new HTTP(url: string, chainInfo: object, options?: object)`

Creates a new HTTP client when the chain info is already known.

#### `HTTP.forURLs([]string, chainHash): Promise<[]Client>`

Provides a shortcut for creating a set of HTTP clients for a set of URLs.

## Contribute

Feel free to dive in! [Open an issue](https://github.com/drand/drand-client/issues/new) or submit PRs.

## License

This project is dual-licensed under Apache 2.0 and MIT terms:

- Apache License, Version 2.0, ([LICENSE-APACHE](https://github.com/drand/drand/blob/master/LICENSE-APACHE) or http://www.apache.org/licenses/LICENSE-2.0)
- MIT license ([LICENSE-MIT](https://github.com/drand/drand/blob/master/LICENSE-MIT) or http://opensource.org/licenses/MIT)
