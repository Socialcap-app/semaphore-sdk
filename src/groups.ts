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
import { Field, Signature, PublicKey, assert } from "o1js";
import { SizedMerkleMap, MerkleHeight } from "./merkles.js"
import { type KVSPool, type KVSPoolType, openPool } from "./kvs-pool.js";
import { cleanLabel } from "./private.js";
import { POOL } from "./config.js";
import { logger } from "./logger.js";

export { 
  Group,
  OwnedGroup,
  GroupHeight
};

const GroupHeight = MerkleHeight;

type PersistentGroup = {
  guid: string,
  owner: string | null, 
  height: number,
  size: string,
  root: string,
  json: string,
  updatedUTC: string,
};

/**
 * The base Group class for all groups.
 * The owner is optional, and may be used by child classes.
 */
class Group {
  guid = ''; // the unique Uid of the group
  height = 0 ; // MerkleHeight: small, medium, big'
  merkle: SizedMerkleMap | null; // the IndexedMerkleMap
  owner: string | null; // the base58 public key of the owner

  // this is the pool where we will store the groups
  // we MUST defined the POOL type with initSdk
  kvs: KVSPool;

  constructor(guid: string, owner?: string) {
    assert(!!guid, "Missing params: the Group requires a guid");
    this.guid = cleanLabel(guid); 
    this.height = 0;
    this.merkle = null;
    this.kvs = openPool(POOL.TYPE as KVSPoolType);
    this.owner = owner || null;
  }

  /**
   * Creates a new empty Group
   * @param guid - the unique name of this group 
   * @param height - the merkle map height
   * @param owner? - optional owner public key (base58) of this group
   * @returns 
   */
  public static create(
    guid: string, 
    height: number,
    owner?: string,
  ): Group | null {
    try {
      assert(height > 0, "Group height must be > 0");
      assert(!!guid, "Group requires a Guid");
      let group = new Group(guid, owner);
      group.init(guid, height, owner);
      return group;
    }  
    catch (error) {
      logger.error("Group create error: ", error);
      throw error;
    }  
  }  

  /**
   * Check id the group Guid already exists in the Pool.
   * @param guid - the unique name of the group
   * @returns - `true` if it exists, `false` otherwise
   * @raises - error if something unexpected happens
   */
  public static exists(guid: string): boolean {
    try {
      let group = new Group(guid);
      return group.kvs.has(group.guid); 
    }
    catch (error) {
      logger.error("Group exists error: ", error);
      throw error;
    }
  }

  /**
   * Reads a Group from the KVS pool
   * @param guid - the unique name of the group
   * @returns - the `group` from storage, or `null` if non existent
   * @raises - error on unexpected errors
   */
  public static read(guid: string): Group | null {
    try {
      let group = new Group(guid);
      let stored = group.kvs.get(group.guid) as PersistentGroup; 
      // if non existent
      if (!stored) return null;
      // rebuild from storage
      group.height = stored.height;
      group.owner = stored.owner;
      group.merkle = SizedMerkleMap.deserialize(stored.json);
      return group;
    }
    catch (error) {
      logger.error("Group read error: ", error);
      throw error;
    }
  }

  /**
   * Initializes a Group with its MerkleMap, etc...
   */
  public init(
    guid: string, 
    height: number,
    owner?: string,
  ): void {
    try {
      // check if it exists
      if (this.kvs.has(guid)) throw Error(
        `Group '${guid}' already exists !`
      );
      // does not exist, we can create it
      this.height = height || MerkleHeight.small; // default is SmallMerkleMap
      this.merkle = SizedMerkleMap.create(this.height);
    }  
    catch (error) {
      logger.error("Group init error: ", error);
      throw error;
    }  
  }  

  /**
   * Saves this Group instance to the associated pool.
   */
  public save() {
    try {
      assert(!!this.kvs, `No KV storage exists for Group: ${this.guid}`);
      (this.kvs as KVSPool).put(this.guid, {
        guid: this.guid,
        owner: this.owner,
        height: this.height,
        size: this.merkle?.length().toString(),
        root: this.merkle?.root().toString(),
        json: this.merkle?.serialize(),
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
      assert(!!this.merkle, `No MerkleMap exists for Group: ${this.guid}`);
      let some = this.merkle?.map;    
      let opt = some.getOption(Field(commitment));
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
  public addMember(commitment: string, signed?: string) {
    try {
      assert(!!commitment, "Missing params: no commitment received");
      assert(!!this.merkle, `No MerkleMap exists for Group: ${this.guid}`);
      let some = this.merkle?.map;    
      some.set(
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
  public removeMember(commitment: string, signed?: string) {
    try {
      assert(!!commitment, "Missing params: no commitment received");
      assert(!!this.merkle, `No MerkleMap exists for Group: ${this.guid}`);
      let some = this.merkle?.map;    
      some.set(
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


/**
 * A Group that has a specific owner.
 * Some operations need that the owner signs the operation.
 */
class OwnedGroup extends Group {

  constructor(guid: string, owner: string) {
    super(guid, owner);
  }

  /**
   * Creates a new OWNED empty Group
   * @param guid - the unique name of this group 
   * @param type - the merkle map size: small | medium | big
   * @param owner - the owner's public key (base58)
   * @returns 
   */
  public static create(
    guid: string, 
    height: number,
    owner: string,
  ): OwnedGroup | null {
    try {
      if (!owner) throw Error(
        "Missing params: this Group requires the owner's public key"
      );
      let group = new OwnedGroup(guid, owner);
      group.init(guid, height, owner);
      return group;
    }  
    catch (error) {
      logger.error("OwnedGroup create error: ", error);
      throw error;
    }  
  }  

  /**
   * Adds this identity commitment to this Group instance
   * @param commitment - the identity to add 
   * @param signed - the signed commitment by the owner
   * @raises - error on unexpected, missing params or signature
   */
  addMember(commitment: string, signed: string) {
    try {
      this.assertParams(commitment, signed);
      this.assertSignature(commitment, signed);
      super.addMember(commitment);
    }
    catch (error) {
      logger.error("OwnedGroup addMember error: ", error);
      throw error;
    }
  }

  /**
   * Removes a member from this Group instance
   * @param commitment - the identity to remove
   * @param signed - the signed commitment by the owner
   * @raises - error on unexpected, missing params or signature
   */
  public removeMember(commitment: string, signed: string) {
    try {
      this.assertParams(commitment, signed);
      this.assertSignature(commitment, signed);
      super.removeMember(commitment);
    }
    catch (error) {
      logger.error("OwnedGroup removeMember error: ", error);
      throw error;
    }
  }

  /**
   * Validate the signature, or raise error if not valid
   */
  private assertSignature(commitment: string, signed: string) {
    // validate signature
    let signature = Signature.fromJSON(JSON.parse(signed));
    const isSigned = signature.verify(
      PublicKey.fromBase58(this.owner as string), 
      [Field(commitment)]
    );
    assert(isSigned.toBoolean(), `Invalid signature for '${commitment}'`);
  }

  /**
   * Assert the received params are ok, or raise error
   */
  private assertParams(commitment: string, signed: string) {
    assert(!!commitment, "Missing params: no commitment received");
    assert(!!signed, "Missing params: no signature received");
    assert(!!this.owner, "Missing params: owner's public key");
  }
}