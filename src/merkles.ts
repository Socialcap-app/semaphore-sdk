/* eslint-disable @typescript-eslint/no-explicit-any */
import { Field, assert } from "o1js";
import { Experimental } from "o1js";
import { bigintFromBase64, bigintToBase64 } from "./utils.js";
import { logger } from "./logger.js";

let IndexedMerkleMapFactory = Experimental.IndexedMerkleMap;
// const { IndexedMerkleMap } = Experimental;

export {
  SizedMerkleMap,
  MerkleHeight
}

enum MerkleHeight {
  small = 12,   // max 4096 nodes
  medium = 16,  // max 65536 nodes
  big = 24,     // max 16777216 nodes 
}

class SizedMerkleMap {
  map: any | null;
  height: number;

  constructor(height: number) {
    assert(height > 0, "MerkleMap height can not be 0")
    this.height = height as number;
    let mapFactory = IndexedMerkleMapFactory(height);
    this.map = new mapFactory();
  }

  public static create(height: MerkleHeight | number): SizedMerkleMap {
    try {
      return new SizedMerkleMap(height as number);
    }
    catch (error) {
      logger.error("SizedMerkleMap create error:", error);
      throw error;
    }
  }

  public static deserialize(json: string): SizedMerkleMap {
    try {
      assert(!!json, "Invalid JSON string");
      return deserializeMap(json);
    }
    catch (error) {
      logger.error("SizedMerkleMap deserialize error:", error);
      throw error;
    }
  }

  public serialize(): string {
    try {
      let json = serializeMap(this);
      return json;
    }
    catch (error) {
      logger.error("SizedMerkleMap serialize error:", error);
      throw error;
    }
  }

  public root(): Field {
    return this.map.root;
  }

  public length(): Field {
    return this.map.length;
  }

  public getSortedKeys(): string[] {
    try {
      return getSortedKeys(this);
    }
    catch (error) {
      logger.error("SizedMerkleMap getSortedKeys error:", error);
      throw error;
    }
  }
}

/**
 * Serializes to JSON a IndexedMerkleMap.
 * Credits: DFSTIO (Mikhail)
 * https://github.com/zkcloudworker/zkcloudworker-tests/blob/main/tests/indexed.map.test.ts
 * @param map the MerkleMap to serialize
 * @returns the serialized JSON string
 */
function serializeMap(sizedMap: SizedMerkleMap): string {
  const snapshot = sizedMap.map.clone();
  //console.log("root map1:", map.root.toJSON());
  //console.log("root map2:", snapshot.root.toJSON());
  const serializedMap = JSON.stringify(
    {
      height: sizedMap.height,
      root: snapshot.root.toJSON(),
      length: snapshot.length.toJSON(),
      nodes: JSON.stringify(snapshot.data.get().nodes, (_, v) =>
        typeof v === "bigint" ? "n" + bigintToBase64(v) : v
      ),
      sortedLeaves: JSON.stringify(
        snapshot.data
          .get()
          .sortedLeaves.map((v: any) => [
            bigintToBase64(v.key),
            bigintToBase64(v.nextKey),
            bigintToBase64(v.value),
            bigintToBase64(BigInt(v.index)),
          ])
      ),
    },
    null,
    2
  );
  // console.log("serializedMap:", serializedMap);
  return serializedMap;
}

/**
 * Deserializes from JSON to an IndexedMerkleMap.
 * Credits: DFSTIO (Mikhail)
 * https://github.com/zkcloudworker/zkcloudworker-tests/blob/main/tests/indexed.map.test.ts
 * @param serialized 
 */
function deserializeMap(serialized: string): SizedMerkleMap {
  const json = JSON.parse(serialized);
  const height = json.height;
  const nodes = JSON.parse(json.nodes, (_, v) => {
    // Check if the value is a string that represents a BigInt
    if (typeof v === "string" && v[0] === "n") {
      // Remove the first 'n' and convert the string to a BigInt
      return bigintFromBase64(v.slice(1));
    }
    return v;
  });
  const sortedLeaves = JSON.parse(json.sortedLeaves).map((row: any) => {
    return {
      key: bigintFromBase64(row[0]),
      nextKey: bigintFromBase64(row[1]),
      value: bigintFromBase64(row[2]),
      index: Number(bigintFromBase64(row[3])),
    };
  });
  //console.log("data:", data);
  let restoredMap = new SizedMerkleMap(height);
  restoredMap.map.root = Field.fromJSON(json.root);
  restoredMap.map.length = Field.fromJSON(json.length);
  restoredMap.map.data.updateAsProver(() => {
    return {
      nodes: nodes.map((row: any) => [...row]),
      sortedLeaves: [...sortedLeaves],
    };
  });
  // console.log("root restored:", restoredMap.root.toJSON());
  return restoredMap;
}

/**
 * Traverse the map and get the keys sorted.
 * We need this to get all the identity commitments in the group.
 * @param map 
 * @returns the array of sorted keys in the map
 */
function getSortedKeys(sizedMap: SizedMerkleMap): string[] {
  // traverse the sorted nodes
  const sortedLeaves = sizedMap.map.data.get().sortedLeaves; 
  const sortedKeys = sortedLeaves?.map((t: any) => {
    // { key, value, nextKey, index }
    // console.log(j, t.index, t.key, t.value)
    return t.key.toString();
  })
  // filter key==0 as it is not part of the real set
  return sortedKeys.filter((t: any) => t !== '0');
}
