/* eslint-disable @typescript-eslint/no-explicit-any */
import { Field } from "o1js";
import { isBrowser } from "./config.js";

export {
  UID
}

let randomUUID: any = {};
if (isBrowser) {
  randomUUID = window.crypto.randomUUID;
}
else {
  let crypto = await import("crypto");
  randomUUID = crypto.randomUUID;
}

class UID {
  /**
   * Create a random version4 UUID easily convertible to a BigInt.
   * @returns UUID without dashes. Ex:'8e141386c85b4f29b12bbd5edd0c0ae9'
   */
  static uuid4(): string {
    return randomUUID().replaceAll('-','').toString();
  }

  static toField(uid: string): Field {
    return Field(BigInt('0x'+uid));
  }

  static fromField(f: Field): string {
    return BigInt(f.toString()).toString(16);
  }

  static toBigint(uid: string): bigint {
    return BigInt('0x'+uid);
  }
}
