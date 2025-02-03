# `Signal` class

The Signal to be broadcasted using the Semaphore protocol. 

A Signal is an anonymous message, broadcasted by an anonymous identity that 
belongs to some group, about which we can prove the following:

- the sender identity is a member of a required group (or groups),
- the sender identity created the message,
- the signal has never been used before.

**Broadcasting and proving**

In our version, **the sender does not generate the proofs directly**. Instead, a 
third party typically handles proving the required conditions, such as during 
signal processing. This approach helps to **decouple broadcasting from proving**, 
as generating proofs in MINA can be computationally intensive and may affect 
the user experience.

Other versions may differ, requiring the user to generate proofs and send them 
along with the signal. We may also offer a version that enables user-side 
proving in the near future.

**Membership proofs**

In our version, **we do not explicitly indicate which group the sender belongs to**,
 as there may be cases where membership verification is required for multiple 
 groups. For example, in Socialcap, we need to verify membership in three 
 different groups: membership in the community, verification that the sender 
 was appointed as a validator for the given ballot or campaign, and confirmation
 that they were assigned as an elector for the specific claim.

Therefore, we allow the prover to assert the required memberships during signal
 processing.

Other versions may differ, requiring the user to generate membership proofs and
 send them along with the signal. We may also offer a version that enables 
 user-side membership proving in the near future.

**Inputs and outputs**

The Signal has three `public inputs`: 

- `sender` : the identity commitment of the user that broadcasts the signal.
- `topic`' : is what we want to talk about, usually an UID of some object 
  or a Merkle root (for example in Socialcap, it is the Claim UID). It MUST 
  be convertible to an o1js Field.
- `message` : the content related to the topic that we want to broadcast, such 
 as a vote for the topic. Note that the message can also be encrypted.

And one `private input`:

- `secretKey` : the sender's identity secret key, used to sign the message
  and create the nullifier.

It produces three `public outputs`: 

- `hash` : the Poseidon hash of the (message, topic, sender) that can be used to
  verify that the message has not been tampered with.
- `nullifier` : the value designed to be a unique identifier and used to 
  prevent the same signal from being used twice. Its is build using a Poseidon
  hash of (secretKey, topic).
- `signature` : the signed signal hash, signed using the sender's secret key,
  and used to verify that the sender created the signal.

## Methods

### [Signal.create](../src/signal.ts#L42)

Creates a new "verifiable" signal.

**Definition**
~~~
static create(
  identity: Identity, 
  topic: Field, 
  message: string,
  encryptionKey?: string
): Signal
~~~

**Params**
- `identity` : an Identity instance, newly created or using an existent saved 
  identity. This object contains the commitment, and the public and secret 
  keys needed to create the signal.
- `topic` : an UUID or a valid ID that can be converted to a Field, and uniquely
  identifies the topic.
- `message` : the message we want to send.
- `encryptionKey?` : optional public encryption key (base58), if present we 
  will encrypt the message using this key.

**Example**
~~~typescript
import { UID, Identity, Signal } from '@socialcap/semaphore-sdk';

// get my existent identity from .private 
let identity = Identity.read('my-identity');

// the Claim UID
let claimUid = 'f217574792114d079168ec69b90eff32';
let voted = "+1"; // positive vote
let encryptionKey = 'B62qr...vUWJ'; // the campaign public encryption key

// create the signal
let signal = Signal.create(
  identity, 
  UID.toField(claimUid),
  voted, 
  encryptionKey
);
~~~

### [Signal.deserialize](../src/signal.ts#L101)

Parses a given serialized signal string and creates a new signal from it. It works together with `.serialize()`.

**Example**
~~~typescript
import { Signal } from '@socialcap/semaphore-sdk';

// the serialized signal string
let str = '{
"encrypted":false,
"commitment":"25223662713658930328525677719365874802677333400569226385200988512355752348787",
"topic":"225671385573248583649685827651311346282",
"message":"+1",
"hash":"25010803138507308531061569835057384688043481188634883926570164370542221821421",
"nullifier":"23591740699663762224229929488593702270466100950336150725486856167399537595175",
"signature":"{\"r\":\"24175559580662817616157272298067166816829033498937946902214172363428141780934\",\"s\":\"3150627461450812218927335009387052839894464016364003246489173807135329302962\"}"
}';

// get my existent identity from .private 
let recoveredSignal = Signal.deserialize(str);
console.log("Recovered signal", recoveredSignal);
~~~

### [serialize](../src/signal.ts#L119)

Serializes a signal instance.

**Example**
~~~typescript
import { UID, Identity, Signal } from '@socialcap/semaphore-sdk';

// get my existent identity from .private 
let identity = Identity.read('my-identity');

// the Claim UID
let claimUid = 'f217574792114d079168ec69b90eff32';
let voted = "+1"; // positive vote
let encryptionKey = 'B62qr...vUWJ'; // the campaign public encryption key

// create the signal
let signal = Signal.create(
  identity, 
  UID.toField(claimUid),
  voted, 
  encryptionKey
);

// serialize it 
let str = signal.serialize();
console.log(str);
~~~


