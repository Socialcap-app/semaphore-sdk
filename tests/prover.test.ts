/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Field, PublicKey, verify, VerificationKey, Proof } from "o1js";
import { Identity } from "../src/identity";
import { IdentityProver, IdentityProof } from "../src/prover";

describe('Create identity and prove it', () => {
  let name = "testidn";
  let pin = "010203";
  let idn = Identity.create(name, pin)!;
  console.log(idn);

  let verificationKey: VerificationKey;
  let ownershipProof: IdentityProof;

  beforeAll(async () => {
    let compiled = await IdentityProver.compile();
    verificationKey = compiled.verificationKey;
  });

  it('Create proofOfOwnership', async () => {
    let signed =   idn.sign([ Field(idn.commitment) ]);
    console.log(signed);

    ownershipProof = await IdentityProver.proveOwnership(
      Field(idn.commitment),
      PublicKey.fromBase58(idn.pk),
      Field(pin),
      signed
    ); 

    console.log('ownershipProof: ', ownershipProof,
      JSON.stringify(ownershipProof.proof.publicInput, null, 2),
      JSON.stringify(ownershipProof.proof.publicOutput, null, 2)
    );

    // test the proof: this will be also be done on the /services side by
    // the retrieveAssignments handler
    const okOwned = await verify(ownershipProof.proof.toJSON(), verificationKey);
    console.log('ownershipProof ok? ', okOwned); 
    expect(okOwned).toBe(true);
  });

  it('Verify identity', async () => {
    let signed =   idn.sign([ Field(idn.commitment) ]);
    console.log(signed);

    let verifiedProof = await IdentityProver.verifyIdentity(
      Field(idn.commitment),
      ownershipProof.proof,
      PublicKey.fromBase58(idn.pk),
      signed
    );

    console.log('verifiedIdentity: ', verifiedProof,
      JSON.stringify(verifiedProof.proof.publicInput, null, 2),
      JSON.stringify(verifiedProof.proof.publicOutput, null, 2)
    );

    // test the proof: this will be also be done on the /services side by
    // the retrieveAssignments handler
    const okOwned = await verify(verifiedProof.proof.toJSON(), verificationKey);
    console.log('verifyIdentity ok? ', okOwned); 
    expect(okOwned).toBe(true);
  });
});  
