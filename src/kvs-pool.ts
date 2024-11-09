/**
 * A generic KeyValue store for saving Semaphore Groups.
 * We provide two storage types: 
 * - 'mem' a memory (non-persistent) pool, can be used in browser and Node
 * - 'lmdb' a LMDB persistent pool, can be used only in Node
 */
import { MemKVS } from "./kvs-mem-pool.js";
import { LmdbKVS } from "./kvs-lmdb-pool.js";

export { 
  type KVSPool, 
  type KVSPoolType, 
  openPool
}

type KVSPool = MemKVS | LmdbKVS;

type KVSPoolType = 'lmdb' | 'mem';

function openPool(type: KVSPoolType): MemKVS | LmdbKVS {
  if (type === 'lmdb') return new LmdbKVS();
  return new MemKVS(); // default 
}
