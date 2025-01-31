# `Group` and `OwnedGroup` classes

Groups are the Semaphore way of managing a set of identity commitments, allowing
to **assert that a given identity is a valid member of a group without revealing
the user's "real" identity**.

Each Group instance must have a unique name (GUID) assigned elsewhere for the 
Group, usually in the form `category.${uid}.items`. Example: 
`communities.8e14...0ae9.electors'`

We implement Groups using an 
[IndexedMerkleMaps](https://github.com/o1-labs/o1js/blob/e1bac02064e0ea3d99719ae385295e1ce48c5127/src/lib/provable/merkle-tree-indexed.ts#L57) 
where we have one MerkleMap per group. This MerkleMap contains all the member 
identity commitments in the Group. 

Each leaf in the map has `key = ${identityCommitment}` and `value = Field(1)`
if enabled or `Field(0)` if disabled. 

This implementation can store its groups in a simple key-value storage pool. 
We provide two pool types:

- **Memory pool**: this is a non-persistent memory store. It stores the 
 key-values in a Map. Can be used both in Node and in Browser.

- **LMDB pool**: this is a persistent key-value store based on LMDB. Can only 
 be used in Node. The PATH where we will store the key-values must be set 
 using the initSdk() method.

There is one entry in the KV pool per Group, where **key** = `${guid}`
 and **value** holds the full Group instance.

**Group and OwnedGroup**

We have two classes that implement groups:

- `Group` class is the base class and provides basic functions for the Group. 
- `OwnedGroup` class implements a Group that has an 'owner', and so certain
 actions (adding and removing members) are allowed only to the owner. 

## `Group` methods

These are the methods for the base Group class, where we can create, read and 
save groups. Also can add and remove members to a group, and check if a certain
identity is a member of the group.

### [Group.create](../src/group.ts#L66)

Creates a new empty instance of Group of the given type, where:

**Definition**
~~~
static Group.create(
  guid: string, 
  type: string
): Group
~~~

**Params**
- `guid` the unique string name for the group.
- `type` the max size of the group MerkleMap: 'small' | 'medium' | 'big'.

**Example**
~~~typescript
import { UID, Group } from '@socialcap/semaphore-sdk';
let guid = `communities.${UID.uuid4()}.electors`;

// create a new group
let group = Group.create(guid, 'medium');
~~~

### [Group.read](../src/group.ts#L122)

Reads an existent group from the storage pool.

**Definition**
~~~
static Group.read(
  guid: string
): Group | null
~~~

**Params**
- `guid` the unique string name for the group

**Returns**
The stored group, or `null` if it does not exist.

**Example**
~~~typescript
import { UID, Group, initSdk } from '@socialcap/semaphore-sdk';

// initialize the SDK with the LMDB folder
initSdk({ LMDB_PATH: './kvstore' })

// read it from the Lmdb pool
let guid = `communities.8e141386c85b4f29b12bbd5edd0c0ae9.electors`;
let group = Group.read(guid, 'lmdb');
~~~

### [save](../src/group.ts#L133)

Saves the instance to the associated pool.

**Definition**
~~~
save(): void
~~~

**Example**
~~~typescript
import { UID, Group } from '@socialcap/semaphore-sdk';

// initialize the SDK with the LMDB folder
initSdk({ LMDB_PATH: './kvstore' })

// create a group
let guid = `communities.${UID.uuid4()}.electors`;
let group = Group.create(guid, 'medium');

// save it to the pool
group.save();
~~~

### [isMember](../src/group.ts#L161)

Check if it is a member of the group.

**Definition**
~~~
isMember(
  commitment: string
): boolean
~~~

**Params**
- `commitment` the identity commitment to check

**Example**
~~~typescript
import { UID, Group, Identity } from '@socialcap/semaphore-sdk';

// get a given group
let guid = `communities.8e141386c85b4f29b12bbd5edd0c0ae9.electors`;
let group = Group.read(guid, 'lmdb');

// check if this identity belongs to the group
let identityCommitment = '22890866...7224';
let exists = group.isMember(identityCommitment);
~~~

### [addMember](../src/group.ts#L183)

Adds a new identity commitment to the group, and assigns `value = Field(1)` to 
the given  identity commitment leaf.

**Definition**
~~~
addMember(
  commitment: string
): void
~~~

**Params**
- `commitment` the identity commitment of the member to add

**Example**
~~~typescript
import { UID, Group, Identity } from '@socialcap/semaphore-sdk';

// get an existent group
let guid = `communities.8e141386c85b4f29b12bbd5edd0c0ae9.electors`;
let group = Group.read(guid, 'lmdb');

// add this identity to the group
let identityCommitment = '22890866...7224';
group.addMember(identityCommitment);
~~~

### [removeMember](../src/group.ts#L207)

Removes a member from the group, by assigning _value = Field(0)_ to the given 
identity commitment leaf.

**Definition**
~~~
removeMember(
  commitment: string
)
~~~

**Params**
- `commitment` the identity commitment of the member to remove

**Example**
~~~typescript
import { UID, Group, Identity } from '@socialcap/semaphore-sdk';

// get an existent group
let guid = `communities.8e141386c85b4f29b12bbd5edd0c0ae9.electors`;
let group = Group.read(guid, 'lmdb');

// remove this identity from the group
let identityCommitment = '22890866...7224';
group.removeMember(identityCommitment);
~~~

## `OwnedGroup` methods

These are the methods for the OwnedGroup class. The main difference is that when
we create a Group we need to give the public key (base58) of the owner, and some
actions need to be signed by the owner. 

The 'owner' can be any MINA account, that can sign the identy commitment to 
add or remove members. NOTE that once we establish and owner for the group, we
 can not change it.

Here we only describe the overloaded methods.

### [Group.create](../src/group.ts#L242)

Creates a new empty instance of OwnedGroup of the given type. We need to provide
 the owner account that will manage this group.

**Definition**
~~~
static Group.create(
  guid: string, 
  type: string,
  owner: string
): Group
~~~

**Params**
- `guid` the unique string name for the group.
- `type` the max size of the group MerkleMap: 'small' | 'medium' | 'big'.
- `owner` public key (base58) of the owner of this group

**Example**
~~~typescript
import { UID, Group } from '@socialcap/semaphore-sdk';

// the owner public key
let pk = 'B62qrUhhbXFxiuwAAkv9SdpSCcwVJfZB1PesH3K4aKpCxCtrAC6vUWJ';

// create a new group
let guid = `communities.${UID.uuid4()}.electors`;
let group = Group.create(guid, 'medium', owner);
~~~

### [addMember](../src/group.ts#L266)

Adds a new identity commitment to the group, and assigns `value = Field(1)` to 
the given  identity commitment leaf.

**Definition**
~~~
addMember(
  commitment: string,
  signed: string
): void
~~~

**Params**
- `commitment` the identity commitment of the member to add
- `signed` is the identity commitment signed using the owner's private key.

**Example**
~~~typescript
import { Signature, Field } from 'o1js';
import { UID, Group, Identity } from '@socialcap/semaphore-sdk';

// get an existent group
let guid = `communities.8e141386c85b4f29b12bbd5edd0c0ae9.electors`;
let group = Group.read(guid, 'lmdb');

// the identity commitment we want to add
let identityCommitment = '22890866...7224';

// the owner nees his/her private key 
let ownerSk = 'EKFXk...42X';

// sign the commitment and serialize the signature
let signature = Signature.create(
  PrivateKey.fromBase58(ownerSk), 
  Field[ identityCommitment ]
);
let signed = JSON.stringify(signature.toJSON());

// add this identity to the group
group.addMember(identityCommitment, signed);
~~~

### [removeMember](../src/group.ts#L284)

Removes a member from the group, by assigning `value = Field(0)` to the 
 corresponding identity commitment leaf.

**Definition**
~~~
removeMember(
  commitment: string,
  signed: string
)
~~~

**Params**
- `commitment` the identity commitment of the member to remove
- `signed` is the identity commitment signed using the owner's private key

**Example**
~~~typescript
import { UID, Group, Identity } from '@socialcap/semaphore-sdk';

// get an existent group
let guid = `communities.8e141386c85b4f29b12bbd5edd0c0ae9.electors`;
let group = Group.read(guid, 'lmdb');

// remove this identity from the group
let identityCommitment = '22890866...7224';

// the owner nees his/her private key 
let ownerSk = 'EKFXk...42X';

// sign the commitment and serialize the signature
let signature = Signature.create(
  PrivateKey.fromBase58(ownerSk), 
  Field[ identityCommitment ]
);
let signed = JSON.stringify(signature.toJSON());

// remove it
group.removeMember(identityCommitment, signed);
~~~
