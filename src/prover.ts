import { Field, Signature, Poseidon, PublicKey, VerificationKey } from "o1js";
import { ZkProgram, SelfProof, Proof, verify } from "o1js";
import { readPrivateFile, savePrivateFile } from "./private.js";
import { Identity } from "./identity.js";
import { logger } from "./logger.js";

export {
  IdentityProver,
  IdentityProof,
  compileIdentityProver,
  restoreVerificationKey,
  proveIdentityOwnership,
  verifyIdentity
}

type IdentityProofPublicInput = Field;
type IdentityProofPublicOutput = Field;
type IdentityProof = { 
  proof: Proof<IdentityProofPublicInput, IdentityProofPublicOutput>; 
  auxiliaryOutput: undefined; 
};

//  locals
let identityProverVK: VerificationKey | null = null;
const VK_FILE = 'identity-prover-vk';

/**
* The IdentityProver is used to prove ownership of a given identity
* and allowing a third party to verifiy that someone owns the given identity 
* just by providing an ownershipProof.
*/ 
const IdentityProver = ZkProgram({
  name: 'prove-commited-identity',
  publicInput: Field, // the identity commitment
  publicOutput: Field,

  methods: {
    /**
     * Proves that the user "owns" this identity.
     * To do this he needs to provide his publicKey, his pin and sign the identity 
     * commitment using his identity private key. 
     * NOTE: This will be done by a user (an elector), so he needs to have 
     * his Identity file on hand.
    */
    proveOwnership: {
      privateInputs: [PublicKey, Field, Signature],

      async method(
        state: Field, // the identity commitment
        publicKey: PublicKey,
        pin: Field, 
        signature: Signature
      ) {
        // rebuild the commitment using the private inputs
        const commitment = Poseidon.hash(
          publicKey.toFields() // the identity publicKey
          .concat([pin]) // the user secret pin number
        );
        state.assertEquals(commitment);

        // verify the signed identity commitment, if it passes 
        // it means it has been signed with this identity secretKey
        signature.verify(publicKey, [state]);
        return {
          publicOutput: state
        };
      },
    },

    /** 
     * Allows a third party to verify that a user "owns" this identity.
     * The user only needs to provide the ownershipProof, and a signature
     * so there is no private data exposed here.
    */
    verifyIdentity: {
      privateInputs: [SelfProof, PublicKey, Signature],

      async method(
        state: Field,  // the identity commitment 
        ownershipProof: SelfProof<Field, Field>,
        publicKey: PublicKey,
        signature: Signature
      ) {
        // verify the received proof
        ownershipProof.verify();

        // verify the proof and the commitment come from the same identity
        state.assertEquals(ownershipProof.publicInput);

        // verify the signed identity commitment, if it passes 
        // it means it has been signed with this identity secretKey
        signature.verify(publicKey, [state]);
        return {
          publicOutput: state
        };
      },
    },
  }
});

// HELPERS /////////////////////////////////////////////////////////////////////

/**
 * Compiles the IdentityProver and saving VerificationKey for futures uses. 
 * It does not use the Cache (yet).
*/
async function compileIdentityProver(): Promise<VerificationKey> {
  try {
    if (!identityProverVK) {
      const { verificationKey } = await IdentityProver.compile();
      identityProverVK = verificationKey;
    }

    // save for future use
    savePrivateFile(VK_FILE, {
      data: identityProverVK.data.toString(),
      hash: identityProverVK.hash.toString()
    })

    return identityProverVK;
  }
  catch (error: unknown) {
    logger.error(`Prover compileIdentityProver error:`, error)
    throw error;
  }
}

/**
 * Restores the verification key from a private file.
 */
function restoreVerificationKey(): VerificationKey | null {
  try {
    const vk = readPrivateFile(VK_FILE);
    if (!vk) return null;
    return {
      data: vk.data,
      hash: Field(vk.hash)
    }
  }
  catch (error: unknown) {
    logger.error(`Prover restoreVerificationKey error:`, error)
    throw error;
  }
}

/**
 * Verifies the identity but does not create a proof of the verification.
 * If a proof of verification is needed use IdentityProver.verifyIdentity() 
 * which also generates a proof.
 * @param commitment - the identity commitment 
 * @param serializedProof - the serialized ownershipProof
 * @param publicKey - base58 publicKey
 * @param serializedSignature - the serialized signed comittment
 * @returns 
 */
async function verifyIdentity(
  commitment: string,  
  serializedProof: string, 
  publicKey: string, 
  serializedSignature: string 
): Promise<boolean> {
  try {
    if (
      !commitment || 
      !serializedProof || 
      !publicKey || 
      !serializedSignature
    ) throw Error(`Prover verifyIdentity error: Missing params`);
    
    // First get the VerificationKey OR compile. NOTE that we do not need 
    // to compile if we already have the VerificationKey.
    let verificationKey = restoreVerificationKey();
    if (!verificationKey) 
      verificationKey = await compileIdentityProver();
    
    // deserialize the received proof
    let ownershipProof = await ZkProgram.Proof(IdentityProver).fromJSON(
      JSON.parse(serializedProof)
    );
    
    // deserialize the received signature
    let signed = Signature.fromJSON(JSON.parse(serializedSignature));
    
    // verify the proof and the commitment come from the same identity
    try { 
      ownershipProof.publicInput.assertEquals(Field(commitment)); 
    }
    catch (error) {
      console.log(`verifyIdentity error: Incompatible commitment and ownershipProof`) 
      return false; 
    }
    
    // check ownership
    const isOwner = await verify(ownershipProof, verificationKey);
    if (!isOwner) {
      console.log(`Prover verifyIdentity failed: Invalid ownershipProof`) 
      return false;
    }  
    
    // check signature
    const isSigned = signed.verify(
      PublicKey.fromBase58(publicKey), 
      [Field(commitment)]
    );
    if (!isSigned.toBoolean()) {
      logger.info(`Prover verifyIdentity failed: Invalid signature`); 
      return false;
    }  
  
    return true;
  }
  catch (error) {
    logger.error(`Prover verifyIdentity error:`, error);
    throw error;
  } 
}

/**
 * Builds the proof that he/she owns this identity.
 * @param identity - the identity object 
 * @param pin - the user PIN
 * @returns the proof as a serialized JSON object
 */
async function proveIdentityOwnership(
  identity: Identity,
  pin: string
): Promise<string | null> {
  try {
    if (!identity || !pin) throw Error(
      `Prover proveIdentityOwnership error: Missing params`
    );

    // we NEED it to be compiled
    let verificationKey = await compileIdentityProver();
    
    // create a proof that the commited identity belongs to us
    const ownershipProof = await IdentityProver.proveOwnership(
      Field(identity.commitment), 
      PublicKey.fromBase58(identity.pk),
      Field(pin),
      identity.sign([Field(identity.commitment)])
    );
    console.log('ownershipProof: ', 
      JSON.stringify(ownershipProof.proof.publicInput, null, 2),
      JSON.stringify(ownershipProof.proof.publicOutput, null, 2)
    );
  
    // test the proof: this will be also be done on the /services side by
    // the retrieveAssignments handler
    const ok = await verify(ownershipProof.proof.toJSON(), verificationKey);
    console.log('ownershipProof ok? ', ok);  
  
    return JSON.stringify(ownershipProof.proof.toJSON());
  }
  catch (error) {
    logger.error(`Prover proveIdentityOwnership error:`, error);
    throw error;
  }
}
