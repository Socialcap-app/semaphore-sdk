# `Identity` class

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

### [Identity.create(label: string, pin: string): Identity](src/identity.ts)

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

### [Identity.read(label: string): Identity](src/identity.ts)

Reads a private JSON identity file from the '~/.private' folder or the LocalStorage, where

   * `name` : the identity label use to create the private file or LocalStorage entry.

Example:

~~~typescript
import { Identity }	from '@socialcap/semaphore-sdk';

// reads it from the private folder
let identity = Identity.read('mario-01');
console.log(`Commitment: ${identity.commitment} `)
~~~

### [.save()](src/identity.ts)

Saves this identity as a JSON string to the private area. In the browser the private area is the LocalStorage. In Node the private area is the '.private' folder.

Example:

~~~typescript
import { Identity }	from '@socialcap/semaphore-sdk';
let identity = Identity.create('mario-01', '0102003');

// save it to private folder
identity.save();
~~~

### [.sign(fields: Field[]): Signature](src/identity.ts)

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

### [Identity.verify(fields: Field[], signature: Signature, pk: string): boolean](src/identity.ts)

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
