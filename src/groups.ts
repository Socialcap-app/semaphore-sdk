/**
 * A Group to be used in Semaphores. 
 * 
 * The group has an IndexedMerkleMap where we register the identity commitment 
 * of each anonymous member.
 * 
 * The group name name will usually follow the pattern: 'category.{}.group', 
 * for example 'communities.0ac2379.electors' or 'claims.406980.nullifiers'.
 * But in fact can use any name convention, for example '{}.items'.
*/
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Field } from "o1js";
import { AnyMerkleMap, createMerkleMap, deserializeMap, serializeMap } from "./merkles.js";
import { type KVSPool, type KVSPoolType, openPool } from "./kvs-pool.js";
import { cleanLabel } from "./private.js";

export { 
  Group 
};

class Group {
  guid = '';
  type = '';
  merkle: AnyMerkleMap | null;
  kvs: KVSPool | null;

  constructor(guid: string) {
    if (!guid) 
      throw Error("A Group requires a Uuid");
    this.guid = cleanLabel(guid); 
    this.type = '';
    this.merkle = null;
    this.kvs = null;
  }

  /**
   * Creates a new empty Group
   * @param guid - the unique name of this group 
   * @param type? - the merkle map size: small | medium | big
   * @param pool? - the pool wher we store this group: mem | lmdb
   * @returns 
   */
  public static create(
    guid: string, 
    type?: string, 
    pool?: KVSPoolType
  ): Group {
    let group = new Group(guid);
    group.type = type || 'small'; // default is SmallMerkleMap
    group.merkle = createMerkleMap(group.type);
    group.kvs = openPool(pool || 'mem'); // default is Mem pool
    return group;
  }  
  
  /**
   * Reads a Group from the KVS pool
   * @param guid - the unique name of the group
   * @param pool - the KVS pool where it is stored: mem | lmdb
   * @returns the fully initialed Group from the storage
   */
  public static read(guid: string, pool?: KVSPoolType): Group {
    let group = new Group(guid);
    group.kvs = openPool(pool || 'mem');
    let map = group.kvs.get(group.guid); 
    if (map) {
      const restored = deserializeMap(map.json, map.type);
      group.merkle = restored;
      group.type = map.type;
    }
    return group;
  }

  /**
   * Saves this Group instance to the associated pool.
   */
  public save() {
    if (!this.kvs)
      throw Error(`No KV storage exists for Group: ${this.guid}`);
    let serialized = serializeMap(this.merkle as AnyMerkleMap);
    (this.kvs as KVSPool).put(this.guid, {
      guid: this.guid,
      type: this.type,
      size: this.merkle?.length.toString(),
      root: this.merkle?.root.toString(),
      json: serialized,
      updatedUTC: (new Date()).toISOString()
    })
  }

  /**
   * Checks if the identity commitment is included in this Group instance
   * @param commitment 
   * @returns True or False
   */
  public isMember(commitment: string): boolean {
    if (!this.merkle) 
      throw Error(`No MerkleMap exists for Group: ${this.guid}`);
    let opt = (this.merkle as AnyMerkleMap).getOption(Field(commitment));
    return (
      opt.isSome.toBoolean() && 
      opt.value.equals(Field(1)).toBoolean()
    )
  }

  /**
   * Adds this identity commitment to this Group instance
   * @param commitment 
   */
  public addMember(commitment: string) {
    if (!this.merkle) 
      throw Error(`No MerkleMap exists for Group: ${this.guid}`);
    (this.merkle as AnyMerkleMap).set(
      Field(commitment),
      Field(1) //flag it as existent
    );
  }

  /**
   * Removes a member from this Group instance
   * @param commitment 
   */
  public removeMember(commitment: string) {
    if (!this.merkle) 
      throw Error(`No MerkleMap exists for Group: ${this.guid}`);
    (this.merkle as AnyMerkleMap).set(
      Field(commitment),
      Field(0) // we do not remove, we flag it as 0
    );
  }
}
