/**
 * A Memory (no-persistent) KeyValue store for saving Semaphore Groups.
 * NOTE: works on Node and in browser.
 * In the browser, only memory groups can be managed.
*/
/* eslint-disable @typescript-eslint/no-explicit-any */
export { 
  MemKVS 
}

class MemKVS {
  private static _POOL: Map<string, any>;

  public get(key: string): any | null {
    const data = MemKVS._POOL.get(key) || null;
    return data;
  }
  
  public put(key: string, data: any) {
    MemKVS._POOL.set(key, data);
  }
}
