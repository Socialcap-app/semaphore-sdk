/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { IdentityProver, IdentityProof } from "../src/prover";
import { FileSystemCache } from "../src/cache";

describe('test cache for IdentityProver', () => {
  // define the cache
  const cache = new FileSystemCache();

  beforeAll(async () => {
    //
  });

  it('First time compile and cache', async () => {
    let compiled = await IdentityProver.compile({ 
      cache: cache,
      forceRecompile: false
    })
    console.log("Compiled", compiled);
  });

  it('Second time compile MUST use cache', async () => {
    let recompiled = await IdentityProver.compile({ 
      cache: cache,
      forceRecompile: false
    })
    console.log("Compiled", recompiled);
  });
});  

