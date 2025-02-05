# Semaphore SDK

A **loose** [MINA Protocol's o1js](https://docs.minaprotocol.com/zkapps/o1js) 
implementation of the **Semaphore protocol**: a zero-knowledge protocol that 
enables users to broadcast a signal and prove their membership in a specific 
group without revealing their identity.

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
- [Groups](./docs/groups.md)
- [Signal](./docs/signal.md)

### Proofs

- [Provers](./docs/prover.md)

### Helpers

- [config](./src/config.ts)
- [UID](./src/uid.ts)
- [SizedMerkleMap](./src/merkles.ts)
- [CipheredText](./src/encryption.ts)
- [LMDB & Mem Pools](./src/kvs-pool.ts)
