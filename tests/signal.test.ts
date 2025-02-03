/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Field, PrivateKey, Signature } from "o1js";
import { Identity } from "../src/identity";
import { Signal } from "../src/signal";
import { UID } from "../src/uid";
import { CipheredText } from "../src/encryption";
import { randomInt, sign } from "crypto";

describe('Create and manage signal', () => {
  // some identity to use in tests
  let name = "testidn";
  let pin = "010203";
  let identity: Identity; 
  let encryptionKey: string;
  
  beforeAll(async () => {
    identity = Identity.create(name, pin);
    identity.save();
    let ballot = Identity.create("ballot-01", "010101");
    encryptionKey = ballot.pk;
  });

  it('Create a signal with simple message', async () => {
    let topic = UID.uuid4();
    let message = "+1"; // positive vote      
    let signal = Signal.create(
      identity,
      UID.toField(topic), // it must be convertible to a Field
      message
    );
    console.log(signal);
    expect(signal).not.toBe(null);
  });

  it('Create a signal with encrypted message', async () => {
    await CipheredText.initialize();

    let topic = UID.uuid4();
    let message = "+1"; // positive vote      
    let signal = Signal.create(
      identity,
      UID.toField(topic), // it must be convertible to a Field
      message,
      encryptionKey
    );
    console.log(signal);
    expect(signal).not.toBe(null);
    expect(signal.encrypted).toBe(true);
  });

  it('Roundtrip serialize/deserialize', async () => {
    let topic = UID.uuid4();
    let message = "+1"; // positive vote      
    let signal = Signal.create(
      identity,
      UID.toField(topic), // it must be convertible to a Field
      message
    );
    console.log(signal);
    expect(signal).not.toBe(null);

    let str = signal.serialize();
    console.log(str);
    expect(str).not.toBe("");

    let recovered = Signal.deserialize(str);
    expect(recovered.commitment).toEqual(signal.commitment);
    expect(recovered.topic).toEqual(signal.topic);
    expect(recovered.message).toEqual(signal.message);
    expect(recovered.encrypted).toEqual(signal.encrypted);
    expect(recovered.hash).toEqual(signal.hash);
    expect(recovered.nullifier).toEqual(signal.nullifier);
    expect(recovered.signature).toEqual(signal.signature);    
  });

  it('Catch empty commitment', async () => {
    try {
      let identity = Identity.create(name, pin);
      identity.commitment = "";
      let topic = UID.uuid4();
      let message = "+1"; // emty message      
      let signal = Signal.create(
        identity,
        UID.toField(topic), // it must be convertible to a Field
        message
      );
    } catch (error) {
      expect(error).not.toBe(null);
    }
  });  

  it('Catch invalid commitment', async () => {
    try {
      let identity = Identity.create(name, pin);
      identity.commitment = "Xxx";
      let topic = UID.uuid4();
      let message = "+1"; // emty message      
      let signal = Signal.create(
        identity,
        UID.toField(topic), // it must be convertible to a Field
        message
      );
    } catch (error) {
      expect(error).not.toBe(null);
    }
  });  

  it('Catch empty secret key', async () => {
    try {
      let identity = Identity.create(name, pin);
      identity.sk = "";
      let topic = UID.uuid4();
      let message = "+1"; // emty message      
      let signal = Signal.create(
        identity,
        UID.toField(topic), // it must be convertible to a Field
        message
      );
    } catch (error) {
      expect(error).not.toBe(null);
    }
  });  

  it('Catch invalid secret key', async () => {
    try {
      let identity = Identity.create(name, pin);
      identity.sk = "Xxx";
      let topic = UID.uuid4();
      let message = "+1"; // emty message      
      let signal = Signal.create(
        identity,
        UID.toField(topic), // it must be convertible to a Field
        message
      );
    } catch (error) {
      expect(error).not.toBe(null);
    }
  });  

  it('Catch invalid topic', async () => {
    try {
      let message = "+1"; // emty message      
      let signal = Signal.create(
        identity,
        Field(0), // it must be convertible to a Field
        message
      );
    } catch (error) {
      expect(error).not.toBe(null);
    }
  });  

  it('Catch empty message', async () => {
    try {
      let message = ""; // emty message      
      let topic = UID.uuid4();
      let signal = Signal.create(
        identity,
        UID.toField(topic), // it must be convertible to a Field
        message
      );
    } catch (error) {
      expect(error).not.toBe(null);
    }
  });  

  it('Catch invalid encryption key', async () => {
    try {
      let message = "+1"; 
      let topic = UID.uuid4();
      let signal = Signal.create(
        identity,
        UID.toField(topic), // it must be convertible to a Field
        message,
        "Xxx"
      );
    } catch (error) {
      expect(error).not.toBe(null);
    }
  });  
});  
