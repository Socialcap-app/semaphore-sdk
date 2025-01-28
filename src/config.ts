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
  console.log("Running in Browser");
}
catch (error) {
  isBrowser = false;
  isNode = !isBrowser;
  console.log("Running in Node");
}

export function initSdk(options: object) {
  env = Object.assign(env, options);       

  LMDB  = {
    PATH: env.LMDB_PATH
  }
  console.log('initSdk LMDB=', LMDB);
}
