/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Field, PrivateKey, Signature } from "o1js";
import { Identity } from "../src/identity";
import { Group, OwnedGroup, GroupHeight } from "../src/groups";
import { randomInt } from "crypto";

describe('Create and manage groups', () => {
  // some identity to use in tests
  let name = "testidn";
  let pin = "010203";
  let identity: Identity; 
  let commitment = "";
  const N = 100;
  let idns: Identity[] = []; // an array of identities

  // we need the owner public (pk) and secret (sk) keys
  let owner: { pk: string, sk: string };
  
  // groups
  let group: Group; 
  let ownedGroup: OwnedGroup;

  function signCommitment(commitment: string, ownerSk: string) {
    let signature = Signature.create(
      PrivateKey.fromBase58(ownerSk), 
      [Field(commitment)]
    );
    return JSON.stringify(signature.toJSON());
  }
  
  beforeAll(async () => {
    identity = Identity.create(name, pin);
    commitment = identity.commitment;
    identity.save();
    
    // we will create a random owner using Identity 
    // but we can use any Mina account
    let { pk, sk } = Identity.create("owner", "666999");
    owner  = { pk, sk };

    // create some identities to test
    for (let j=0; j < N; j++) {
      idns[j] = Identity.create(`idn${j}`, j.toString().padStart(6,'0'));
    }
  });

  it('Create small, medium and big Groups', async () => {
    let gsmall = Group.create('gsmall', GroupHeight.small);
    expect(gsmall).not.toBe(null);
    let len = gsmall?.merkle?.map?.length.toBigInt();
    expect(len).toBe(1n);

    let gmedium = Group.create('gmedium', GroupHeight.medium);
    expect(gmedium).not.toBe(null);
    let len2 = gmedium?.merkle?.map?.length.toBigInt();
    expect(len2).toBe(1n);

    let gbig = Group.create('gbig', GroupHeight.big);
    expect(gbig).not.toBe(null);
    let len3 = gbig?.merkle?.map?.length.toBigInt();
    expect(len3).toBe(1n);
  });

  it('Create a big group and add N members', async () => {
    group = Group.create('group.01', GroupHeight.big) as Group;
    expect(group).not.toBe(null);
    let len = group?.merkle?.map?.length.toBigInt();
    expect(len).toBe(1n);

    // add items
    for (let j=0; j < N; j++) {
      group.addMember(idns[j].commitment);
    }
    len = group?.merkle?.map?.length.toBigInt();
    expect(len).toBe(BigInt(N+1));
  });
  
  it('Check random identities exist in Group', async () => {
    let count = 0;
    for (let j=0; j < N; j++) {
      let k = randomInt(0,N);
      let isMember = group.isMember(idns[k].commitment);
      expect(isMember).toBe(true);
      count = count + (isMember ? 1 : 0);
    }
    // all checks should be ok
    expect(count).toBe(N);
  });

  it('Remove random identities from Group', async () => {
    let count = 0;
    for (let j=0; j < N; j++) {
      let k = randomInt(0,N);
      // remove it
      let idn = idns[k].commitment;
      group.removeMember(idn)
      // check it was removed
      let isMember = group.isMember(idn);
      expect(isMember).toBe(false);
      count = count + (!isMember ? 1 : 0);
    }
    // all checks should be ok
    expect(count).toBe(N);
  });

  it('Create a big Owned group and add N members', async () => {
    ownedGroup = OwnedGroup.create('group.02', GroupHeight.big, owner.pk) as OwnedGroup;
    expect(ownedGroup).not.toBe(null);
    let len = ownedGroup?.merkle?.map?.length.toBigInt();
    expect(len).toBe(1n);

    // add items
    for (let j=0; j < N; j++) {
      let idnc = idns[j].commitment;
      ownedGroup.addMember(idnc, signCommitment(idnc, owner.sk));
    }
    len = ownedGroup?.merkle?.map?.length.toBigInt();
    expect(len).toBe(BigInt(N+1));
  });
  
  it('Check random identities exist in OwnedGroup', async () => {
    let count = 0;
    for (let j=0; j < N; j++) {
      let k = randomInt(0,N);
      let idnc = idns[k].commitment;
      let isMember = ownedGroup.isMember(idnc);
      expect(isMember).toBe(true);
      count = count + (isMember ? 1 : 0);
    }
    // all checks should be ok
    expect(count).toBe(N);
  });

  it('Remove random identities from OwnedGroup', async () => {
    let count = 0;
    for (let j=0; j < N; j++) {
      let k = randomInt(0,N);
      // remove it
      let idnc = idns[k].commitment;
      ownedGroup.removeMember(idnc, signCommitment(idnc, owner.sk))
      // check it was removed
      let isMember = ownedGroup.isMember(idnc);
      expect(isMember).toBe(false);
      count = count + (!isMember ? 1 : 0);
    }
    // all checks should be ok
    expect(count).toBe(N);
  });

  it('Check invalid signature in OwnedGroup', async () => {
    try {
      let idnx = Identity.create("bad-owner", "001100");
      console.log(idnx);
      ownedGroup.addMember(
        idnx.commitment, 
        signCommitment(idnx.commitment, idnx.sk)
      );
    }
    catch (error) {
      console.log(error);
      expect(error).not.toBe(null);
    }
  });
});  
