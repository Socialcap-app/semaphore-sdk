/**
 * A LMDB KeyValue store for saving Semaphore Groups.
 * NOTE: only works on Node, not in browser.
*/
/* eslint-disable @typescript-eslint/no-explicit-any */
import { open } from "lmdb" ;
import { LMDB } from "./config.js";
import { logger } from "./logger.js";

export { 
  LmdbKVS 
}

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

  private static openDb(options?: { log: any }) {
    if (LmdbKVS._DB) return LmdbKVS._DB;
    let logging = options?.log || logger;
    logging.info(`Open KVStore path='${LMDB.PATH}'`);
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
      logging.error(err);
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
