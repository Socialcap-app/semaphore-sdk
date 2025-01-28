import { Cache, CacheHeader } from "o1js";
import fs from "fs";

export {
  FileSystemCache
};

class FileSystemCache implements Cache {
  constructor(
    public debug: boolean = false,
    public directory = ".cache"
  ) {}

  read(header: CacheHeader): Uint8Array | undefined {
    console.log("Reading from cache", header.persistentId);
    try {
      return new Uint8Array(
        fs.readFileSync(this.directory + "/" + header.persistentId)
      );
    } catch (e) {
      return undefined;
    }
  }

  write(header: CacheHeader, value: Uint8Array): void {
    console.log("Writing to cache", header.persistentId);
    fs.writeFileSync(this.directory + "/" + header.persistentId, value);
  }

  canWrite = true;
}