/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Identity } from "../src/identity";

describe('Semaphore Identity', () => {
  let name = "testidn";
  let pin = "605435";
  let saved: Identity;

  it('Creates a new Identity object and saves it', async () => {
    let identity = Identity.create(name, pin);
    expect(identity?.commitment).not.toBe(null);
    console.log(identity);
    saved = identity!;
    identity?.save();
  });

  it('Reads an existent Identity object', async () => {
    let identity = Identity.read(name);
    expect(identity.commitment).toBe(saved.commitment);
    console.log(identity);
  });

});
