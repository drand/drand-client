package key

import (
	bls "github.com/drand/kyber-bls12381"
	"github.com/drand/kyber/sign/tbls"
)

// Pairing is the main pairing suite used by drand. New interesting curves
// should be allowed by drand, such as BLS12-381.
var Pairing = bls.NewBLS12381Suite()

// KeyGroup is the group used to create the keys
var KeyGroup = Pairing.G1()

// Scheme is the signature scheme used, defining over which curve the signature
// and keys respectively are.
var Scheme = tbls.NewThresholdSchemeOnG2(Pairing)
