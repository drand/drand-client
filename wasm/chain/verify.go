package chain

import (
	"bytes"
	"crypto/sha256"
	"encoding/binary"

	"github.com/drand/drand-client/wasm/key"
	"github.com/drand/kyber"
)

// Verify checks beacon components to see if they are valid.
func Verify(pubkey kyber.Point, prevSig, signature []byte, round uint64) error {
	msg := Message(round, prevSig)
	return key.Scheme.VerifyRecovered(pubkey, msg, signature)
}

// Message returns a slice of bytes as the message to sign or to verify
// alongside a beacon signature.
// H ( prevSig || currRound)
func Message(currRound uint64, prevSig []byte) []byte {
	h := sha256.New()
	_, _ = h.Write(prevSig)
	_, _ = h.Write(RoundToBytes(currRound))
	return h.Sum(nil)
}

// RoundToBytes provides a byte serialized form of a round number
func RoundToBytes(r uint64) []byte {
	var buff bytes.Buffer
	_ = binary.Write(&buff, binary.BigEndian, r)
	return buff.Bytes()
}
