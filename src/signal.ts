/**
 * The Signal to be broadcasted using the Semaphore protocol.
 * See: ../docs/signal.md
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrivateKey, Signature, Poseidon, Field, assert } from "o1js";
import { logger } from "./logger.js";
import { Identity } from "./identity.js";
import { CipheredText } from "./encryption.js";

export { Signal }

class Signal {
  // inputs
  commitment: string; // signal creator identity comittment
  topic: string;      // signal topic (some Uid)
  message: string;    // signal message
  encrypted = false;  // indicates the message is encrypted
  // outputs
  hash: string;       // hash(message,topic,commitment) to broadcast
  nullifier: string;  // hash(identity.sk, topic)
  signature: string;  // signature of hash(hash) using identity.sk

  constructor(commitment: string, topic?: string, message?: string) {
    this.commitment = commitment;
    this.topic = topic || '';
    this.message = message || '';
    this.encrypted = false;
    this.hash = '';
    this.nullifier = '';
    this.signature = '';
  }  

  /**
   * Creates a new signal
   * @param identity - the Identity instance
   * @param topic - a topic Uid
   * @param message - the message 
   * @param encryptionKey? - optional encryption key
   * @returns - a new Signal
   */
  static create(
    identity: Identity, 
    topic: Field, 
    message: string,
    encryptionKey?: string
  ): Signal {
    try {
      assert(!!identity, "Missing params: No identity provided");
      assert(!!identity.commitment, "Missing params: No identity commitment");
      assert(!!identity.sk, "Missing params: No identity secret key");
      assert(!!topic, "Missing params: No topic provided");
      assert(topic.toString() !== Field(0).toString(), "Missing params: Invalid Field(0) topic");
      assert(!!message, "Missing params: No message provided");
      let signal = new Signal(identity.commitment, topic.toString(), message);
  
      // first check if we need to encrypt the message
      let emessage = message;
      if (encryptionKey) {
        emessage = CipheredText.encrypt(message, encryptionKey);
        signal.encrypted = true;
      }
      signal.message = emessage;
  
      // the signal 'hash' = 'hash(message, topic, commitment)'
      let fields = (emessage || '')
        .split('')
        .map((t): Field => Field(t.charCodeAt(0)))
      signal.hash = Poseidon.hash(
        fields
        .concat([Field(signal.topic)])
        .concat([Field(signal.commitment)])
      ).toString();
  
      // the signal 'nullifier' = 'hash(secretKey, topic)'
      signal.nullifier = Poseidon.hash(
        PrivateKey.fromBase58(identity.sk).toFields()
        .concat([Field(topic)])
      ).toString();
  
      // finally the signature
      let signature = Signature.create(
        PrivateKey.fromBase58(identity.sk), 
        [Field(signal.hash)]
      );
      signal.signature = JSON.stringify(signature.toJSON());
  
      return signal;
    }
    catch (error) {
      logger.error("Signal create error:", error);
      throw error;
    }
  } 

  /**
   * Receives a serialized string and recreates the signal
   * @param stream - a serialized signal string
   * @returns - a Signal
   */
  static deserialize(stream: string): Signal {
    assert(!!stream, "Empty input stream");
    try {
      let ds = JSON.parse(stream);
      let signal = new Signal(ds.comittment);
      signal = Object.assign(signal, ds);
      return signal;
    }
    catch (error) {
      logger.error("Signal deserialize error:", error);
      throw error;
    }
  }

  /**
   * Create a serialized signal ready for broadcasting
   * @returns - a stringified Signal
   */
  serialize(): string {
    return JSON.stringify(this);
  }
}
