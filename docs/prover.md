# `IdentityProver` ZkProgram

This ZkProgram is used to prove ownership of a given identity and also allows 
a third party to verifiy that someone owns the given identity just by using 
the ownershipProof.

The prover always returns an `IdentityProof`:
~~~
type IdentityProofPublicInput = Field;
type IdentityProofPublicOutput = Field;

type IdentityProof = { 
  proof: Proof<IdentityProofPublicInput, IdentityProofPublicOutput>; 
  auxiliaryOutput: undefined; 
};
~~~

Where: 
- The `IdentityProofPublicInput` is the identity commitment
- The `IdentityProofPublicOutput` is also the identity commitment

## Methods

### [IdentityProver.proveOwnership](../src/prover.ts#L44])

Proves that the user "owns" this identity. To do this he needs to provide his 
`publicKey`, his `pin` and `sign` his identity commitment using his identity 
private key. 

The resultant proof can then be send to third parties and will be used by them 
to verify ownership of the identity.

**Definition**
~~~
async IdentityProver.proveOwnership(
  state: Field, 
  publicKey: PublicKey, 
  pin: Field, 
  signature: Signature
): IdentityProof
~~~

**Public input**
- `state`: the identity commitment, as a Field

**Private inputs**
- `publicKey`: is the identity public key, as a PublickKey object
- `pin`: the identity pin, as a Field
- `signature`: the signed identity commitment

**Public output**
- `state`: the received identity commitment, as a Field

**Example**
~~~typescript
import { Field, PublicKey, verify, VerificationKey, Proof } from "o1js";
import { Identity, IdentityProver, IdentityProof }	from '@socialcap/semaphore-sdk';

// we can use a previously created and saved identity
const idn = Identity.read('my-anon-identity');

// compile the ZkProgram
const { verificationKey } = await IdentityProver.compile();

// now we can prove that we own this identity
const ownershipProof = await IdentityProver.proveOwnership(
  Field(idn.commitment),        // commitment
  PublicKey.fromBase58(idn.pk), // publicKey
  Field(pin),                   // pin
  idn.sign([ Field(idn.commitment) ]) // signed commitment
); 

// test the proof
const ok = await verify(ownershipProof.proof.toJSON(), verificationKey);
~~~

### [IdentityProver.verifyIdentity](../src/prover.ts#L74)

Allows a third party to verify that a user "owns" this identity. The user only 
needs to provide to the verifier his ownershipProof, his public key, and his 
signed idn commitment so there is no private data exposed here.

NOTE that this generates a proof of the verification. If a proof is not needed
you can use the helper function 'verifyIdentity()' that does not generate a 
proof and will be much faster.

**Definition**
~~~
async IdentityProver.verifyIdentity(
  state: Field, 
  ownershipProof: SelfProof<Field, Field>, 
  publicKey: PublicKey, 
  signature: Signature
): IdentityProof
~~~   

**Public input**
- `state`: the user identity commitment, as a Field

**Private inputs**
- `ownershipProof`: the ownerhip proof provided by the user
- `publicKey`: the identity public key provided by the user
- `signature`: the signed identity commitment provided by the user

**Public output**
- `state`: the received identity commitment, as a Field

**Example (third party verifying a given identity)**
~~~typescript
import { Field, PublicKey, verify, Signature, VerificationKey, ZkProgram } from "o1js";
import { Identity, IdentityProver, IdentityProof }	from '@socialcap/semaphore-sdk';

// the owner of the identity needs to provide these to the verifier
const commitment = '6437...2641';
const serializedOwnershipProof = '{"publicInput":["2779...4174"], ... ,"proof":"KChzd...pKQ=="}';
const serializedSigned = '{"r":"1424...6435","s":"1081..4734"}';
const pk = 'B62qkdXmLZWpkQgaRirz9bQ6rkLKeTWW28X9jXGmfGm73K6LkVetLov';

// FIRST we need to deserialize received params
const proof = await ZkProgram.Proof(IdentityProver).fromJSON(
  JSON.parse(serializedOwnershipProof)
);
const signed = Signature.fromJSON(
  JSON.parse(serializedSigned)
)
const publicKey = PublicKey.fromBase58(pk);

// compile the ZkProgram
const { verificationKey } = await IdentityProver.compile();

// now we can prove that it was verified 
let verifiedProof = await IdentityProver.verifyIdentity(
  Field(commitment),        // commitment
  proof,
  publicKey,
  signed
);

// test the proof
const ok = await verify(verifiedProof.proof.toJSON(), verificationKey);
~~~

## Helpers

These are helper function that simplify usage of the IdentityProver.

### [verifyIdentity](../src/prover.ts#L143)

Verifies the given user identity (the user has provided a valid ownership proof, 
and he has correctly signed it), but does not create a proof of the 
verification. 

It does not need to compile the contract if the verification key is already 
saved and is MUCH faster than IdentityProver. It is also easier to use.

If proof of verification is needed use `IdentityProver.verifyIdentity()` which 
also generates a proof.

**Definition** 
~~~
async function verifyIdentity(
  commitment: string,  
  serializedProof: string, 
  publicKey: string, 
  serializedSignature: string 
): Promise<boolean>
~~~   

**Params**
- `commitment` the identity commitment 
- `serializedProof` the serialized ownershipProof created by IdentityProver
- `publicKey` base58 publicKey
- `serializedSignature` the serialized signed commitment

**Returns**

- `true` if the verification is ok, `false` otherwise

**Example**

~~~typescript
import { verifyIdentity }	from '@socialcap/semaphore-sdk';

// the owner of the identity needs to provide these to the verifier
const commitment = '6437...2641';
const ownershipProofStr = '{"publicInput":["2779...4174"], ... ,"proof":"KChzd...pKQ=="}';
const signedStr = '{"r":"1424...6435","s":"1081..4734"}';
const pk = 'B62qkdXmLZWpkQgaRirz9bQ6rkLKeTWW28X9jXGmfGm73K6LkVetLov';

// now we can verify it
// we do not need to deserialize anything
const isVerified = await verifyIdentity(
  commitment,
  ownershipProofStr,
  pk,
  signedStr
);
console.log(`isVerified? ${isVerified}`);
~~~

