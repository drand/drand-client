# drand client

[![Build Status](https://travis-ci.org/alanshaw/drand-client.svg?branch=master)](https://travis-ci.org/alanshaw/drand-client)
[![dependencies Status](https://david-dm.org/alanshaw/drand-client/status.svg)](https://david-dm.org/alanshaw/drand-client)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

A client to the drand randomness beacon network.

⚠️ This client does not yet support full/partial chain _verification_ and it should NOT be used in production for anything security critical.

## Install

In the browser or deno you can grab and use the client from a CDN e.g. https://cdn.jsdelivr.net/npm/@alanshaw/drand-client/drand.js. In Node.js, install with `npm install @alanshaw/drand-client`.

## Usage

The `drand-client` supports multiple transports, although only HTTP is available currently.

### Browser

```html
<script type="module">
import Client, { HTTP } from 'https://cdn.jsdelivr.net/npm/@alanshaw/drand-client/drand.js'

const chainHash = '138a324aa6540f93d0dad002aa89454b1bec2b6e948682cde6bd4db40f4b7c9b' // (hex encoded)
const drand = await Client.wrap(
    HTTP.forURLs(['http://drand.network'], chainHash),
    { chainHash }
)
const res = await drand.get()

console.log(res)
</script>
```

### Deno

Usage in [deno](https://deno.land/) is the same as the [browser](#browser), minus the HTML `<script>` tag. Ensure you run your script with the the `--allow-net` flag e.g. `deno run --allow-net client.js`.

### Node.js

If you'd like to run it in Node.js, add [`fetch`](http://npm.im/node-fetch) and [`AbortController`](http://npm.im/abort-controller) as globals e.g.

```js
import Client, { HTTP } from '@alanshaw/drand-client'
import fetch from 'node-fetch'
import AbortController from 'abort-controller'

global.fetch = fetch
global.AbortController = AbortController

// Use as per browser example...
```

**From common.js:**

```js
global.fetch = require('node-fetch')
global.AbortController = require('abort-controller')
const { default: Client, HTTP } = await import('@alanshaw/drand-client')
```

### Get a specific round

```js
const round = 1
const res = await drand.get(round)
```

### Get chain information

```js
info = await drand.info()
```

### Watch for new randomness rounds

```js
for await (const res of drand.watch()) {
    console.log(res)
}
```

## Contribute

Feel free to dive in! [Open an issue](https://github.com/alanshaw/drand-client/issues/new) or submit PRs.

## License

This project is dual-licensed under Apache 2.0 and MIT terms:

- Apache License, Version 2.0, ([LICENSE-APACHE](https://github.com/drand/drand/blob/master/LICENSE-APACHE) or http://www.apache.org/licenses/LICENSE-2.0)
- MIT license ([LICENSE-MIT](https://github.com/drand/drand/blob/master/LICENSE-MIT) or http://opensource.org/licenses/MIT)
