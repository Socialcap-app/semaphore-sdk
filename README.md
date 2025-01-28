# Semaphore SDK

An `o1js` implementation of the **Semaphore protocol**: a zero-knowledge protocol that allows you to cast a signal and prove you are a member of  certain group without revealing your identity.

See: https://semaphore.pse.dev/

### Articles

**Community Proposal:
Semaphore: Zero-Knowledge Signaling on Ethereum**

- Kobi Gurkan (Ethereum Foundation and C Labs) 
  Koh Wei Jie (Ethereum Foundation)
  Barry Whitehat (Independent)
  February 2, 2020

- https://semaphore.pse.dev/whitepaper-v1.pdf

**To Mixers and Beyond: presenting Semaphore, a privacy gadget built on Ethereum**: 

- Koh Wei Jie - Sep 2, 2019

- https://medium.com/coinmonks/to-mixers-and-beyond-presenting-semaphore-a-privacy-gadget-built-on-ethereum-4c8b00857c9b

### Classes

- [Identity](./docs/identity.md)
- [Group](./docs/group.md)
- [Signal](./docs/signal.md)

### Proofs

- [Provers](./docs/prover.md)

### Helpers

- [config](../src/config.ts)
- [UID](../src/uid.ts)
- [AnyMerkleMap](../src/merkles.ts)
- [CipheredText](../src/encryption.ts)
- [Lmdb Pool](../src/kvs-lmdb-pool.ts)
- [Mem Pool](../src/kvs-mem-pool.ts)
