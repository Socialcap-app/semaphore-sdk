# Signals

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
