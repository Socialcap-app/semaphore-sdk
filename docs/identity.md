# `Identity` class

The Semaphore identity is created by hashing some private inputs (a public key 
 and a numeric pin) to obtain an _identity commitment_ which can be used as an 
 anonymous identity, without revealing the real identity.

Relevant attributes of an Identity instance are:

- `sk`: a random newly created secret key, 
- `pk`: a newly created public key 
- `pin`: a user created 6 digits pin number, initialy 000000
- `commitment`: the identity commitment, used to identify this identity  

The `commitment` is obtained using `Poseidon.hash([pk, pin])` .

## Methods

### [Identity.create](../src/identity.ts#L60)

Creates a new Identity instance, with new random public and private keys, where:

**Definition** 
<pre style="font-style: italic">
static Identity.create(
  label: string, 
  pin: string
): Identity | null
</pre>   

**Params**
- `label` a unique name for this identity which will be used to store the 
  identity under this name (in a private file or local storage).
- `pin` a secret six digits number given by the user, used to build the commitment.

**Returns**
- An initialized identity instance, or null on failure

**Example**
~~~typescript
import { Identity }	from '@socialcap/semaphore-sdk';

// creates a new anonymous identity
let identity = Identity.create('mario-01', '0102003');
console.log(`Commitment: ${identity.commitment}`)
~~~

### [Identity.read](../src/identity.ts#L83)

Reads a private JSON identity file from the '~/.private' folder or the LocalStorage, where

**Definition** 
<pre style="font-style: italic">
static Identity.read(
  label: string
): Identity | null
</pre>   

**Params**
- `label` the identity label use to create the private file or LocalStorage entry.

**Returns**
- The stored identity instance, or null on failure

**Example**
~~~typescript
import { Identity }	from '@socialcap/semaphore-sdk';

// reads it from the private folder
let identity = Identity.read('mario-01');
console.log(`Commitment: ${identity.commitment} `)
~~~

### [save](../src/identity.ts#L88)

Saves this identity instance as a JSON string to the private area. In the 
browser the private area is the LocalStorage. In Node the private area is 
the '.private' folder.

**Definition**
<pre style="font-style: italic">
save(): void
</pre>   

**Example**
~~~typescript
import { Identity }	from '@socialcap/semaphore-sdk';
let identity = Identity.create('mario-01', '0102003');

// save it to private folder
identity.save();
~~~

### [sign](../src/identity.ts#L92)

Signs an array of Fields using the identity secret key.

**Definition**
<pre style="font-style: italic">
sign(
  fields: Field[]
): Signature
</pre>   

**Params**
- `fields` is the array of fields to sign using the identity private key

**Returns**
- The signed array, or null on failure

**Example**
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

