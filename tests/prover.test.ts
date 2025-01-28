/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Field, PublicKey, verify, VerificationKey, ZkProgram, SelfProof, JsonProof, Signature } from "o1js";
import { Identity } from "../src/identity";
import { IdentityProver, IdentityProof, compileIdentityProver, verifyIdentity, proveIdentityOwnership } from "../src/prover";

describe('Create identity and prove it', () => {
  let name = "testidn";
  let pin = "010203";
  let idn = Identity.create(name, pin)!;
  console.log(idn);

  let verificationKey: VerificationKey;
  let ownershipProof: IdentityProof;

  beforeAll(async () => {
    verificationKey = await compileIdentityProver();
  });

  it('Create proofOfOwnership', async () => {
    let signed = idn.sign([ Field(idn.commitment) ]);
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
    expect(ownershipProof.proof.publicInput).toStrictEqual(ownershipProof.proof.publicOutput);

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

  it('JSON serialize/deserialize roundtrip', async () => {
    // serialize the proof
    let jsonProof = ownershipProof.proof.toJSON();
    let stringifiedJsonProof = JSON.stringify(jsonProof);
    console.log("stringifiedJsonProof", `"${stringifiedJsonProof}"`);

    // serialize the signature
    let stringifiedSignature = JSON.stringify(
      (idn.sign([ Field(idn.commitment) ])).toJSON()
    );

    // deserialize the stringified proof
    // we need to use a subclass 'ZkProgram.Proof(IdentityProver)'
    let recoveredProof = await ZkProgram.Proof(IdentityProver).fromJSON(
      JSON.parse(stringifiedJsonProof)
    );

    // verify its ok
    let ok = await verify(recoveredProof.toJSON(), verificationKey);
    expect(ok).toBe(true);
  });

  it('Verify identity using helper function', async () => {
    // serialize proof and signature
    let proofString = JSON.stringify(
      ownershipProof.proof.toJSON()
    );
    let signedString = JSON.stringify(
      idn.sign([Field(idn.commitment)]).toJSON()
    );

    // the helper function is much easier to use !
    const isVerified = await verifyIdentity(
      idn.commitment,
      proofString,
      idn.pk,
      signedString
    );
    expect(isVerified).toBe(true);
  });  

  it('Verify identity with invalid proof', async () => {
    // create other users identity and proof
    let other = Identity.create("other-one", "010203") as Identity;
    let proofStr = await proveIdentityOwnership(other, "010203");
    let signedStr = JSON.stringify(other.sign([Field(other.commitment)]).toJSON());

    // now verify 'other', but use a bad commitment
    const isVerified = await verifyIdentity(
      idn.commitment, // this is wrong ! 
      proofStr!,
      idn.pk,
      signedStr
    );
    expect(isVerified).toBe(false);
  });  
});  

