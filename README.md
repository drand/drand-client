# drand client

A client to the drand randomness beacon network.

⚠️ This client uses esmodules and is expected to be run in the browser. If you'd like to run it in Node.js, add [`fetch`](http://npm.im/node-fetch) and [`AbortController`](http://npm.im/abort-controller) as globals.

⚠️ This client does not yet support full/partial chain _verification_ and it should NOT be used in production for anything security critical.

## Usage

The `drand-client` supports multiple transports, although only HTTP is available currently.

```js
import Client, { HTTP } from 'drand-client'

const chainHash = '138a324aa6540f93d0dad002aa89454b1bec2b6e948682cde6bd4db40f4b7c9b' // (hex encoded)
const drand = await Client.wrap(
    HTTP.forURLs(['http://drand.network'], chainHash),
    { chainHash }
)
const res = await drand.get()

console.log(res)
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

## License

This project is dual-licensed under Apache 2.0 and MIT terms:

- Apache License, Version 2.0, ([LICENSE-APACHE](https://github.com/drand/drand/blob/master/LICENSE-APACHE) or http://www.apache.org/licenses/LICENSE-2.0)
- MIT license ([LICENSE-MIT](https://github.com/drand/drand/blob/master/LICENSE-MIT) or http://opensource.org/licenses/MIT)
