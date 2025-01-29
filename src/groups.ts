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
import { SizedMerkleMap, AnyMerkleMap } from "./merkles.js";
import { type KVSPool, type KVSPoolType, openPool } from "./kvs-pool.js";
import { cleanLabel } from "./private.js";
import { POOL } from "./config.js";
import { logger } from "./logger.js";

export { 
  Group 
};

type PersistentGroup = {
  guid: string,
  type: string,
  size: string,
  root: string,
  json: string,
  updatedUTC: string
};

class Group {
  guid = '';
  type = '';
  merkle: AnyMerkleMap | null;

  // this is the pool where we will store the groups
  // we MUST defined the POOL type with initSdk
  kvs: KVSPool;

  constructor(guid: string) {
    if (!guid) throw Error(
      "Missing params: the Group requires a guid"
    );
    this.guid = cleanLabel(guid); 
    this.type = '';
    this.merkle = null;
    this.kvs = openPool(POOL.TYPE as KVSPoolType);
  }

  /**
   * Creates a new empty Group
   * @param guid - the unique name of this group 
   * @param type? - the merkle map size: small | medium | big
   * @returns 
   */
  public static create(
    guid: string, 
    type?: string
  ): Group | null {
    try {
      let group = new Group(guid);
      group.type = type || 'small'; // default is SmallMerkleMap
      let some = new AnyMerkleMap(group.type);
      group.merkle = some.empty();
      return group;
    }  
    catch (error) {
      logger.error("Group create error: ", error);
      throw error;
    }  
  }  
  
  /**
   * Reads a Group from the KVS pool
   * @param guid - the unique name of the group
   * @returns the fully initialized Group from the storage
   */
  public static read(guid: string): Group {
    try {
      let group = new Group(guid);
      let map = group.kvs.get(group.guid); 
      let some = new AnyMerkleMap(group.type);    
      if (map) {
        group.merkle = some.deserialize(map.json);
        group.type = map.type;
      }
      return group;
    }
    catch (error) {
      logger.error("Group read error: ", error);
      throw error;
    }
  }

  /**
   * Saves this Group instance to the associated pool.
   */
  public save() {
    try {
      if (!this.kvs) throw Error(
        `No KV storage exists for Group: ${this.guid}`
      );
      let some = (this.merkle as AnyMerkleMap);    
      let serialized = some.serialize();
      (this.kvs as KVSPool).put(this.guid, {
        guid: this.guid,
        type: this.type,
        size: some.map?.length.toString(),
        root: some.map?.root.toString(),
        json: serialized,
        updatedUTC: (new Date()).toISOString()
      } as PersistentGroup)
    }
    catch (error) {
      logger.error("Group save error: ", error);
      throw error;
    }
  }

  /**
   * Checks if the identity commitment is included in this Group instance
   * @param commitment 
   * @returns True or False
   */
  public isMember(commitment: string): boolean {
    try {
      if (!this.merkle) 
        throw Error(`No MerkleMap exists for Group: ${this.guid}`);
      let some = (this.merkle as AnyMerkleMap);    
      let opt = (some.map as SizedMerkleMap).getOption(Field(commitment));
      return (
        opt.isSome.toBoolean() && 
        opt.value.equals(Field(1)).toBoolean()
      )
    }
    catch (error) {
      logger.error("Group isMember error: ", error);
      throw error;
    }
  }

  /**
   * Adds this identity commitment to this Group instance
   * @param commitment 
   */
  public addMember(commitment: string) {
    try {
      if (!this.merkle) 
        throw Error(`No MerkleMap exists for Group: ${this.guid}`);
      let some = (this.merkle as AnyMerkleMap);    
      (some.map as SizedMerkleMap).set(
        Field(commitment),
        Field(1) //flag it as existent
      );
    }
    catch (error) {
      logger.error("Group addMember error: ", error);
      throw error;
    }
  }

  /**
   * Removes a member from this Group instance
   * @param commitment 
   */
  public removeMember(commitment: string) {
    try {
      if (!this.merkle) throw Error(
        `No MerkleMap exists for Group: ${this.guid}`
      );
      let some = (this.merkle as AnyMerkleMap);    
      (some.map as SizedMerkleMap).set(
        Field(commitment),
        Field(0) // we do not remove, we flag it as 0
      );
    }
    catch (error) {
      logger.error("Group removeMember error: ", error);
      throw error;
    }
  }
}
