/**
 * A Configuration module for managing the Enviro vars
 * needed by this Semaphore SDK implementation
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export {
  isBrowser,
  isNode,
  LMDB 
}

let isBrowser = false;
let isNode = false;

// LMDB key value store config
let LMDB = {
  PATH: ''
};

let env: any = {};

try {
  isBrowser = (window !== undefined && window.document !== undefined);
  isNode = !isBrowser;
  console.log("initSdk: running in Browser");
}
catch (error) {
  isBrowser = false;
  isNode = !isBrowser;
  console.log("initSdk: running in Node");
}

export function initSdk(options: object) {
  env = Object.assign(env, options);       
  //console.log('initSdk: set NATS=',NATS);

  LMDB  = {
    PATH: env.LMDB_PATH
  }
  console.log('initSdk: set LMDB=', LMDB);
}
