/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Field } from "o1js";
import { SizedMerkleMap, MerkleHeight } from "../src/merkles";
import { randomInt } from "crypto";

describe('Merkle maps with size', () => {

  it('Creates a new SizedMerkleMap with enum big', async () => {
    let map = SizedMerkleMap.create(MerkleHeight.big);
    console.log(map);
  });

  it('Creates a new SizedMerkleMap with height', async () => {
    let map = SizedMerkleMap.create(12);
    console.log(map);
  });

  it.only('Add some nodes to the map', async () => {
    let sized = SizedMerkleMap.create(MerkleHeight.small);
    console.log("Initial size: ", sized, sized.map.length.toString())
    // console.log("Height: ", sized.map.height());
    // add some items
    const N = 100;
    for (let j=0; j < N; j++) {
      let key = Field(j+1);
      let value = Field(randomInt(0, 10000));
      sized.map.set(key, value);
    }
    console.log("New size: ", sized.map.length.toString())
    expect(sized.map.length.toString()).toBe((N+1).toString());
  });

  it('Serialize/deserialize roundtrip', async () => {
    let sized = SizedMerkleMap.create(MerkleHeight.small);
    console.log("Initial size: ", sized, sized.map.length.toString())
    // add some items
    const N = 100;
    for (let j=0; j < N; j++) {
      let key = Field(j+1);
      let value = Field(randomInt(0, 10000));
      sized.map.set(key, value);
    }
    console.log("New size: ", sized.map.length.toString())
    expect(sized.map.length.toString()).toBe((N+1).toString());

    // serialize
    let str = sized.serialize();
    console.log("Serialized ", str);
    expect(str).not.toBe("");

    // deserialize
    let recovered = SizedMerkleMap.deserialize(str);
    console.log("New size: ", recovered.map.length.toString())
    expect(recovered.map.length.toString()).toBe((N+1).toString());
  });

  it('Gets sorted map keys', async () => {
    let sized = SizedMerkleMap.create(MerkleHeight.small);
    console.log("Initial size: ", sized, sized.map.length.toString())
    // add some items
    const N = 100;
    for (let j=0; j < N; j++) {
      let key = Field(j+1);
      let value = Field(randomInt(0, 10000));
      sized.map.set(key, value);
    }
    console.log("New size: ", sized.map.length.toString())
    expect(sized.map.length.toString()).toBe((N+1).toString());

    let sortedKeys = sized.getSortedKeys();
    console.log("Sorted keys: ", sortedKeys);
    expect(sortedKeys.length).toEqual((N));
  });
});
