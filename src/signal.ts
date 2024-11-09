/**
 * The Signal to be broadcasted using the Semaphore protocol.
 * 
 * The Signal has two main aspects, the 'topic' which is what we want to talk 
 * about and the "message" related to that topic that we want to broadcast.
 * 
 * Usage:
 * 
 *    let signal = Signal.create(identity, claimUid, "+1"):
 *    signal = signal.sign(identity);
 *    signal = signal.encrypt();
 * 
 * The full Signal contains:
 * - topic: the object we talk about (usually an Uid)
 * - message: the message to send (unencrypted, we encrypt before sending)
 * - encrypted: the encrypted message (if it was encrypted)
 * - signal: hash of the message to broadcast, example hash(message)
 * - nullifier: which uniquely identifies a signal, example: hash(sk, claimUid)
 * - signature: signature of hash(nullifier, signal) using identity sk
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrivateKey, Signature, Poseidon, Field } from "o1js";
import { Identity } from "./identity.js";

export { Signal }

class Signal {
  topic: string; // signal topic (some Uid)
  message: string; // signal message
  encrypted: string; // signal message BUT encrypted with encryptionKey
  nullifier: string; // hash(identity.sk, topic)
  hash: string; // signal hash (message) to broadcast
  signature: string; // signature of hash(nullifier, signal) using identity.sk

  static create(
    identity: Identity, 
    topic: string, 
    message: string
  ): Signal {
    let obj = new Signal(identity, topic, message);
    obj.encrypted = '';
    return obj;
  } 

  constructor(identity: Identity, topic: string, message: string) {
    this.nullifier = Poseidon.hash(
      PrivateKey.fromBase58(identity.sk).toFields()
      .concat([Field(topic)])
    ).toString();

    let fields = (message || '')
      .split('')
      .map((t): Field => Field(t.charCodeAt(0)))
    this.hash = Poseidon.hash(fields).toString();

    this.message = message;
    this.encrypted = "";
    this.topic = topic;
    this.signature = "";
  }

  /**
   * Sign the created 'signal' using the identity privateKey.
   * @param identity 
   */
  sign(identity: Identity): Signal {
    let signature = Signature.create(
      PrivateKey.fromBase58(identity.sk), 
      [Field(this.hash), Field(this.nullifier)]
    );
    this.signature = signature.toJSON();
    return this;
  }

  /**
   * Encrypts the message using the identity encryptionKey.
   * @param identity 
   */
  encrypt(identity: Identity): Signal {
    this.encrypted = this.message; // BUT encrypted !
    return this;
  }
}
