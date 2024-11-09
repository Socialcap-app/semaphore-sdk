# Semaphore SDK

An `o1js` implementation of the **Semaphore protocol**: a zero-knowledge protocol that allows you to cast a signal and prove you are a member of  certain group without revealing your identity.

See: https://semaphore.pse.dev/

### Articles

**Community Proposal:
Semaphore: Zero-Knowledge Signaling on Ethereum**

- Kobi Gurkan (Ethereum Foundation and C Labs) 
  Koh Wei Jie (Ethereum Foundation)
  Barry Whitehat (Independent)
  February 2, 2020

- https://semaphore.pse.dev/whitepaper-v1.pdf

**To Mixers and Beyond: presenting Semaphore, a privacy gadget built on Ethereum**: 

- Koh Wei Jie - Sep 2, 2019

- https://medium.com/coinmonks/to-mixers-and-beyond-presenting-semaphore-a-privacy-gadget-built-on-ethereum-4c8b00857c9b

## Identity

The Semaphore identity is created by hashing some private inputs (a public key and a numeric pin) to obtain an _identity commitment_ which can be used as an anonymous identity, without revealing the real identity.

Relevant attributes of an Identity instance are:

~~~typescript
sk = ''; //  a random newly created secret key, 
pk = ''; // a newly created public key 
pin = ''; // a user created 6 digits pin number, initialy 000000
commitment = ''; // the identity commitment, used to identify this identity  
~~~

The `commitment` is obtained using `Poseidon.hash(pk, pin)` .

**Methods**

[Identity.create(label: string, pin: string): Identity](src/identity.ts)

Creates a new Identity instance, with new random public and private keys, where:

- `label`: a unique name for this identity which will be used to store the identity under this name (in a private file or local storage).
- `pin`: a secret six digits number given by the user, used to build the commitment.

Example:

~~~typescript
import { Identity }	from '@socialcap/semaphore-sdk';

// creates a new anonymous identity
let identity = Identity.create('mario-01', '0102003');
console.log(`Commitment: ${identity.commitment}`)
~~~

[Identity.read(label: string): Identity](src/identity.ts)

Reads a private JSON identity file from the '~/.private' folder or the LocalStorage, where

   * `name` : the identity label use to create the private file or LocalStorage entry.

Example:

~~~typescript
import { Identity }	from '@socialcap/semaphore-sdk';

// reads it from the private folder
let identity = Identity.read('mario-01');
console.log(`Commitment: ${identity.commitment} `)
~~~

[.save()](src/identity.ts)

Saves this identity as a JSON string to the private area. In the browser the private area is the LocalStorage. In Node the private area is the '.private' folder.

Example:

~~~typescript
import { Identity }	from '@socialcap/semaphore-sdk';
let identity = Identity.create('mario-01', '0102003');

// save it to private folder
identity.save();
~~~

[.sign(fields: Field[]): Signature](src/identity.ts)

Signs an array of Fields using the identity secret key.

~~~typescript
import { Signature, Field } from 'o1js';
import { Identity }	from '@socialcap/semaphore-sdk';
let identity = Identity.create('mario-01', '0102003');

// convert the string message to an array of Fields
let message = 'This is the message we will sign';
let fields = message
	.split('')
	.map((t): Field => Field(t.charCodeAt(0)))

// sign the message fields array
let signature = identity.sign(fields);
console.log(`Signed message '${message}': `, signature.toJSON());
~~~

[Identity.verify(fields: Field[], signature: Signature, pk: string): boolean](src/identity.ts)

Verify the message and its signature using the identity public key.

~~~typescript
import { Signature, Field } from 'o1js';
import { Identity }	from '@socialcap/semaphore-sdk';
let identity = Identity.create('mario-01', '0102003');

// convert the string message to an array of Fields
let message = 'This is the message we will sign';
let fields = message
	.split('')
	.map((t): Field => Field(t.charCodeAt(0)))

// sign the message fields array
let signature = identity.sign(fields);

// verify it 
let verified = Identity.verify(fields, signature, identity.pk);
console.log(`Verified message '${message}': `, verified);
~~~

## Group

Each Group instance must have a unique name (GUID) assigned elsewhere for the Group, usually in the form `category.${uid}.items`. Example: ` communities.8e141386c85b4f29b12bbd5edd0c0ae9.electors'`

There is one [IndexedMerkleMap](https://github.com/o1-labs/o1js/blob/e1bac02064e0ea3d99719ae385295e1ce48c5127/src/lib/provable/merkle-tree-indexed.ts#L57) per group that contains all the member identity commitments in the Group. It can be used to verify membership of a given commitment.

Each leaf in the map has **key** = `${identityCommitment}` and **value** = `Field(1)`
 if enabled or `Field(0)` if disabled. 

This implementation can store its groups in a very simple key-value storage pool. We provide two pool types:

- **Memory pool**: this is a non-persistent memory store. It stores the key-values in a Map. Can be used both in Node and in Browser.

- **LMDB pool**: this is a persistent key-value store based on LMDB. Can only be used in Node. The PATH where we will store the key-values must be set using the initSdk() method.

There is one entry in the KV pool per Group, where **key** = `${guid}`
 and **value** holds the full Group instance.

**Methods**

[Group.create(guid: string, type?: string,  pool?: 'mem' | 'lmdb'): Group](src/group.ts)

Creates a new empty instance of Group of the given type, where:

- `guid` : the unique string name for the group.
- `type` : the max size of the MerkleMap associated to this group: 'small' | 'medium' | 'big'.
- `pool`: the pool where we will store this Group: 'mem' | 'lmdb'.

Example:

~~~typescript
import { UID, Group } from '@socialcap/semaphore-sdk';
let guid = `communities.${UID.uuid4()}.electors`;

// create a new group
let group = Group.create(guid, 'medium', 'lmdb');
~~~

[Group.read(guid: string, pool?: 'mem' | 'lmdb'): Group](src/group.ts)

Reads an existent group from the  given pool, where:

- `guid` : the unique string name for the group.
- `pool` : the pool type: 'mem' | 'lmdb'. 

~~~typescript
import { UID, Group, initSdk } from '@socialcap/semaphore-sdk';
initSdk({
	LMDB_PATH: './kvstore'
})
let guid = `communities.8e141386c85b4f29b12bbd5edd0c0ae9.electors`;

// read it from the Lmdb pool
let group = Group.read(guid, 'lmdb');
~~~

[.save()](src/group.ts)

Saves the instance to the associated pool.

~~~typescript
import { UID, Group } from '@socialcap/semaphore-sdk';
let guid = `communities.${UID.uuid4()}.electors`;
let group = Group.create(guid, {type: 'medium', pool: 'lmdb'});

// save it to the pool
group.save();
~~~

[.addMember(commitment: string)](src/group.ts)

Adds a new identity commitment to the group.  If it exists it assigns _value = Field(1)_ to the given  identity commitment leaf.

~~~typescript
import { UID, Group, Identity } from '@socialcap/semaphore-sdk';
let identity = Identity.read('some-idn', '010101');
let guid = `communities.8e141386c85b4f29b12bbd5edd0c0ae9.electors`;
let group = Group.read(guid, 'lmdb');

// add this identity to the group
group.addMember(identity.commitment);
~~~

[.isMember(commitment: string): boolean](src/group.ts)

Check if it is a member of the group.

~~~typescript
import { UID, Group, Identity } from '@socialcap/semaphore-sdk';
let identity = Identity.read('some-idn', '010101');
let guid = `communities.8e141386c85b4f29b12bbd5edd0c0ae9.electors`;
let group = Group.read(guid, 'lmdb');

// check this identity to the group
let exists = group.isMember(identity.commitment);
~~~

[.removeMember(commitment: string)](src/group.ts)

Removes a member from the group, by assigning _value = Field(0)_ to the given  identity commitment leaf.

~~~typescript
import { UID, Group, Identity } from '@socialcap/semaphore-sdk';
let identity = Identity.create('some-idn', '010101');
let guid = `communities.8e141386c85b4f29b12bbd5edd0c0ae9.electors`;
let group = Group.read(guid, 'lmdb');

// remove this identity from the group
group.removeMember(identity.commitment);
~~~

## Signal

## Proofs



