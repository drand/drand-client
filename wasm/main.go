// To compile use
// GOOS=js GOARCH=wasm go build -ldflags="-s -w" -o drand.wasm main.go
package main

import (
	"encoding/hex"
	"fmt"
	"syscall/js"

	"github.com/drand/drand-client/wasm/chain"
	"github.com/drand/drand-client/wasm/key"
)

var done = make(chan struct{})

func main() {
	done := make(chan struct{})
	js.Global().Set("drand", map[string]interface{}{
		"verifyBeacon": js.FuncOf(verifyBeacon),
	})
	<-done
}

// verifyBeacon expects the arguments in order:
// 1. public key in hexadecimal
// 2. beacon - and object with the following properties:
//     - `previous_signature` in hexadecimal
//     - `round` in base 10
//     - `signature` in hexadecimal
// and returns a Promise that resolves if the beacon is valid or rejects if not.
func verifyBeacon(_ js.Value, args []js.Value) interface{} {
	var pF js.Func
	pF = js.FuncOf(func(_ js.Value, pargs []js.Value) interface{} {
		resolve, reject := pargs[0], pargs[1]

		go func() {
			defer pF.Release()

			if len(args) < 2 {
				reject.Invoke(toJSError(fmt.Errorf("not enough arguments to verify beacon")))
				return
			}

			publicBuff, err := hex.DecodeString(args[0].String())
			if err != nil {
				reject.Invoke(toJSError(fmt.Errorf("decoding public key hex: %w", err)))
				return
			}

			beacon := args[1]
			if beacon.Type() != js.TypeObject {
				reject.Invoke(toJSError(fmt.Errorf("invalid beacon type")))
				return
			}

			prevBuff, err := hex.DecodeString(beacon.Get("previous_signature").String())
			if err != nil {
				reject.Invoke(toJSError(fmt.Errorf("decoding previous signature hex: %w", err)))
				return
			}

			sigBuff, err := hex.DecodeString(beacon.Get("signature").String())
			if err != nil {
				reject.Invoke(toJSError(fmt.Errorf("decoding signature hex: %w", err)))
				return
			}

			round := beacon.Get("round").Int()
			if int(uint64(round)) != round {
				reject.Invoke(toJSError(fmt.Errorf("invalid round: %d", round)))
				return
			}

			pub := key.KeyGroup.Point()
			if err := pub.UnmarshalBinary(publicBuff); err != nil {
				reject.Invoke(toJSError(fmt.Errorf("unmarshaling public key: %v", err)))
				return
			}

			err = chain.Verify(pub, prevBuff, sigBuff, uint64(round))
			if err != nil {
				reject.Invoke(toJSError(err))
				return
			}
			resolve.Invoke()
		}()

		return nil
	})

	return js.Global().Get("Promise").New(pF)
}

func toJSError(err error) js.Value {
	return js.Global().Get("Error").New(err.Error())
}
