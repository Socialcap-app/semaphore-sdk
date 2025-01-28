/* eslint-disable @typescript-eslint/no-explicit-any */
import { Field } from "o1js";
import { Experimental } from "o1js";
import { bigintFromBase64, bigintToBase64 } from "./utils.js";

const { IndexedMerkleMap } = Experimental;

export {
  AnyMerkleMap,
  SizedMerkleMap,
  SmallMerkleMap,
  MediumMerkleMap,
  BigMerkleMap
}

class SmallMerkleMap extends IndexedMerkleMap(12) {} // max 4096 nodes
class MediumMerkleMap extends IndexedMerkleMap(16) {} // max 65536 nodes
class BigMerkleMap extends IndexedMerkleMap(24) {} // max 16777216 nodes

type SizedMerkleMap = BigMerkleMap | MediumMerkleMap | SmallMerkleMap ;

class AnyMerkleMap {
  map: SizedMerkleMap | null = null;
  type: string;

  constructor(type: string) {
    this.type = type || 'small';
    this.map = null;
  }

  public empty(): AnyMerkleMap {
    this.map = createMerkleMap(this.type)
    return this;
  }

  public serialize(): string {
    let json = serializeMap(this.map as SizedMerkleMap);
    return json;
  }

  public deserialize(json: string): AnyMerkleMap {
    this.map = deserializeMap(json, this.type);
    return this;
  }

  public getSortedKeys(): string[] {
    return getSortedKeys(this.map as SizedMerkleMap);
  }
}

/**
 * Factory: creates a new Merkle of the given size.
 * @param size "small | medium | big"
 * @returns SizedMerkleMap
 */
function createMerkleMap(options?: string): SizedMerkleMap {
  if (options?.includes('small')) 
    return new SmallMerkleMap() as SizedMerkleMap;
  if (options?.includes('medium')) 
    return new MediumMerkleMap() as SizedMerkleMap;
  if (options?.includes('big')) 
    return new BigMerkleMap() as SizedMerkleMap;
  // default
  return new SmallMerkleMap() as SizedMerkleMap; 
}  

/**
 * Serializes to JSON a IndexedMerkleMap.
 * Credits: DFSTIO (Mikhail)
 * https://github.com/zkcloudworker/zkcloudworker-tests/blob/main/tests/indexed.map.test.ts
 * @param map the MerkleMap to serialize
 * @returns the serialized JSON string
 */
function serializeMap(map: SizedMerkleMap): string {
  const snapshot = map.clone();
  //console.log("root map1:", map.root.toJSON());
  //console.log("root map2:", snapshot.root.toJSON());
  const serializedMap = JSON.stringify(
    {
      root: snapshot.root.toJSON(),
      length: snapshot.length.toJSON(),
      nodes: JSON.stringify(snapshot.data.get().nodes, (_, v) =>
        typeof v === "bigint" ? "n" + bigintToBase64(v) : v
      ),
      sortedLeaves: JSON.stringify(
        snapshot.data
          .get()
          .sortedLeaves.map((v) => [
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
function deserializeMap(serialized: string, type?: string): SizedMerkleMap {
  const json = JSON.parse(serialized);
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
  const restoredMap = createMerkleMap(type); 
  restoredMap.root = Field.fromJSON(json.root);
  restoredMap.length = Field.fromJSON(json.length);
  restoredMap.data.updateAsProver(() => {
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
function getSortedKeys(map: SizedMerkleMap): string[] {
  // traverse the sorted nodes
  const sortedLeaves = map.data.get().sortedLeaves; 
  const sortedKeys = sortedLeaves?.map((t) => {
    // { key, value, nextKey, index }
    // console.log(j, t.index, t.key, t.value)
    return t.key.toString();
  })
  // filter key==0 as it is not part of the real set
  return sortedKeys.filter((t) => t !== '0');
}
