/**
 * A generic KeyValue store for saving Semaphore Groups.
 * We provide two storage types: 
 * - 'mem' a memory (non-persistent) pool, can be used in browser and Node
 * - 'lmdb' a LMDB persistent pool, can be used only in Node
*/
/* eslint-disable @typescript-eslint/no-explicit-any */
import { open } from "lmdb" ;
import { LMDB } from "./config.js";
import { logger } from "./logger.js";

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

/**
 * A Memory (no-persistent) KeyValue store for saving Semaphore Groups.
 * NOTE: works on Node and in browser.
 * In the browser, only memory groups can be managed.
*/
class MemKVS {
  private static _POOL = new Map<string, any>();

  public get(key: string): any | null {
    const data = MemKVS._POOL.get(key) || null;
    return data;
  }
  
  public put(key: string, data: any) {
    MemKVS._POOL.set(key, data);
  }

  public has(key: string) {
    return MemKVS._POOL.has(key);
  }
}

/**
 * A LMDB KeyValue store for saving Semaphore Groups.
 * See: https://github.com/kriszyp/lmdb-js
 * NOTE: only works on Node, not in browser.
*/
class LmdbKVS {
  private static _DB: any = null;

  public get(key: string): any | null {
    const db = LmdbKVS.openDb();
    const data = db.get(key) || null;
    return data;
  }
  
  public put(key: string, data: any) {
    const db = LmdbKVS.openDb();
    db.transaction(() => {
      db.put(key, data);
    });
  }

  public has(key: string) {
    const db = LmdbKVS.openDb();
    return db.doesExist(key);
  }

  private static openDb(options?: { log: any }) {
    if (LmdbKVS._DB) return LmdbKVS._DB;
    logger.info(`Open KVStore path='${LMDB.PATH}'`);
    try {
      const db = open({
        path: LMDB.PATH,
        // any options go here
        encoding: 'msgpack',
        sharedStructuresKey: Symbol.for('sharedstructures'),
        cache: true,
        // compression: true,
      });
      LmdbKVS._DB = db;
    }
    catch (err) {
      logger.error(`ERROR opening KVStore path:'${LMDB.PATH}'`, err);
      LmdbKVS._DB = null;
      throw Error(`ERROR opening KVStore path:'${LMDB.PATH}' reason:'${err}'`);
    }
    return LmdbKVS._DB;
  }

  public static async find(q: string) {
    const db = LmdbKVS.openDb();
    if (!q) throw Error("KVS.find requires a search word.")
    let found: any[] = [];
    db.getRange()
      .filter((t: any) => q && t.key.includes(q))
      .forEach((t: any) => {
        found.push(t)
      })
    return found;  
  }

  public static async browseKeys(q: string | undefined) {
    console.log(`\n---\nBrowse LMDB`);
    const db = LmdbKVS.openDb({ log: console });
    console.log(`Search ${q ? `keys containing: '${q}'` : 'all keys'}`)
    db.getRange()
      .filter((t: any) => (q ? t.key.includes(q) : true ))
      .forEach((t: any) => {
        console.log(`\n${t.key}: `, JSON.stringify(t.value, null, 2));
      })
  }
}
