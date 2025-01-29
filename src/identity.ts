/**
 * A Identity to be used in Semaphores.
 * 
 * The commited identity hash is calculated using the user publicKey,
 * and a special 6 digits personal pin.
 * 
 * A given user will have only one commited and registered identity, 
 * but the same identity can be present in more than one Group.
 */
import { PrivateKey, Poseidon, Field, Signature } from "o1js";
import { readPrivateFile, savePrivateFile, setPrivateFolder, cleanLabel } from "./private.js";
import { logger } from "./logger.js";

export { 
  Identity 
} ;

class Identity {
  label = ''; // a user defined label name for this identity
  commitment = ''; // the identity commitment, used to identify this identity
  sk = ''; //  a random newly created secret key, 
  pk = ''; // a newly created public key 
  pin = ''; // a pin nullifier, a user created 6 digits number, initialy 0
  skHash = ''; // the secret key hash, used to verify the secret key when input by user
  pinHash = ''; // the pin hash, used to verify the pin key when input by user
  encryptionKey = ''; // encryption key returned by service when registered
  ownershipProof = ''; // proof that he owns this identity
  // DEPRECATED trapdoor from Semaphore v4, a newly created random 6 digits number 

  constructor(label: string, pin: string) {
    this.label = cleanLabel(label);
    this.pin = pin.padStart(6, '0');

    // new random private,public key pair
    const rsk = PrivateKey.random();
    const rpk = rsk.toPublicKey();
    this.pk = rpk.toBase58();
    this.sk = rsk.toBase58();
    
    // finally calculate commitment
    this.commitment = Poseidon.hash(
      rpk.toFields() // the identity publicKey
      .concat([Field(this.pin)]) // the user Pin number
    ).toString();

    // calculate helper validate hashes
    this.skHash = Poseidon.hash(rsk.toFields()).toString();
    this.pinHash = Poseidon.hash([Field(this.pin)]).toString();
  }

  /** 
   * Create a new identity for this user.
   * NOTE: It will also create a random private key and derived public key for 
   * this identity. BUT this key pair is NOT associated to his wallet or any 
   * MINA account. It will be used only for signing signals and verifying 
   * signatures, so it will not be possible to trace its use to any account 
   * thus preserving anonymity.
   * @param label a name or label for this identity, assigned by user
   * @param pin a six digits pin number, assigned by the user
  */ 
  static create(label: string, pin: string): Identity {
    try {
      return new Identity(label, pin.padStart(6, '0'));
    }
    catch (error: unknown) {
      logger.error(`Identity create error:`, error)
      throw error;
    }
  }

  /**
   * Set the private folder path (default is ~/.private)
   * @param path 
   */
  static privateFolder(path: string) {
    try {
      setPrivateFolder(path);
    }
    catch (error: unknown) {
      logger.error(`Identity privateFolder error:`, error)
      throw error;
    }
  }

  /**
   * Reads a private JSON identity file from the '~/.private' folder
   * @param name 
   * @returns the data obj
   */
  static read(name: string): Identity {
    try {
      let obj = readPrivateFile(cleanLabel(name));
      return Object.assign(new Identity(obj.label, obj.pin), obj);
    }
    catch (error: unknown) {
      logger.error(`Identity read error:`, error)
      throw error;
    }
  }
  
  public save(): void {
    try {
      savePrivateFile(this.label, this);
    }
    catch (error: unknown) {
      logger.error(`Identity save error:`, error)
      throw error;
    }
  }

  public sign(fields: Field[]): Signature {
    try {
      let signature = Signature.create(
        PrivateKey.fromBase58(this.sk), 
        fields
      );
      return signature;
    }
    catch (error) {
      console.log(`Identity sign error:`, error);
      throw error;
    }
  }
}
