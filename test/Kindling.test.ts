/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect as vexpect, it } from 'vitest';
import { binToHex, encodeLockingBytecodeP2pkh, hash160, hexToBin } from '@bitauth/libauth';
import { SignatureTemplate } from '@solidcash/solidcash';
import { ethers, loadFixture } from '@solidcash/testing';
import { mineUpTo } from '@solidcash/testing/network-helpers';
import { expect } from '@solidcash/testing/chai';

const GOAL = 50_000n;
const sign = (signer: any) => new SignatureTemplate(signer.privateKey);
const pubkeyBin = (signer: any): Uint8Array =>
  typeof signer.publicKey === 'string' ? hexToBin(signer.publicKey) : signer.publicKey;
const p2pkhHex = (signer: any) => binToHex(encodeLockingBytecodeP2pkh(hash160(pubkeyBin(signer))));
const outputHex = (output: any) => {
  const lock = output.lockingBytecode ?? output.to;
  return typeof lock === 'string' ? lock : binToHex(Uint8Array.from(lock));
};
const outputAmount = (output: any) => BigInt(output.valueSatoshis ?? output.amount ?? output.satoshis);
const paidTo = (tx: any, signer: any) =>
  tx.outputs.filter((o: any) => outputHex(o) === p2pkhHex(signer)).map(outputAmount);

async function deployFixture() {
  const [creator, alice, bob, mallory] = await ethers.getSigners();
  const height = BigInt(await ethers.provider.getBlockNumber());
  const deadline = height + 10n;
  const factory = await ethers.getContractFactory('Kindling', creator);
  const kindling = await factory.deploy(creator.publicKey, GOAL, deadline, {
    initialState: { raised: 0n, backers: 0n, phase: 0n },
    initialBalance: 2_000n,
  });
  await kindling.waitForDeployment();
  return { kindling: kindling as any, creator, alice, bob, mallory, deadline };
}

const pledge = (kindling: any, backer: any, amount: bigint) =>
  kindling.connect(backer).pledge(backer.publicKey, sign(backer)).withValue(amount);
const claim = (kindling: any, signer: any) => kindling.connect(signer).claim(sign(signer));
const refund = (kindling: any, backer: any, locktime: bigint, amount?: bigint) => {
  const call = kindling.connect(backer).refund(backer.publicKey, sign(backer)).setLocktime(Number(locktime));
  return amount === undefined ? call : call.transfer(encodeLockingBytecodeP2pkh(hash160(pubkeyBin(backer))), amount);
};

describe('Kindling: pledging', () => {
  it('records a pledge, counts the backer and emits Pledged', async () => {
    const { kindling, alice } = await loadFixture(deployFixture);
    await expect(pledge(kindling, alice, 20_000n)).to.emit(kindling, 'Pledged')
      .withArgs(hash160(pubkeyBin(alice)), 20_000n, 20_000n);
    const state = await kindling.getState();
    expect(state.raised).to.equal(20_000n);
    expect(state.backers).to.equal(1n);
  });

  it('adds repeat pledges to the same entry without counting the backer twice', async () => {
    const { kindling, alice, bob } = await loadFixture(deployFixture);
    await pledge(kindling, alice, 15_000n).send();
    await pledge(kindling, alice, 12_000n).send();
    await pledge(kindling, bob, 10_000n).send();
    const state = await kindling.getState();
    expect(state.raised).to.equal(37_000n);
    expect(state.backers).to.equal(2n);
  });

  it('rejects a pledge below the minimum', async () => {
    const { kindling, alice } = await loadFixture(deployFixture);
    await expect(pledge(kindling, alice, 9_999n)).to.be.reverted;
    expect((await kindling.getState()).raised).to.equal(0n);
  });

  it('rejects a pledge signed by a different key than the one credited', async () => {
    const { kindling, alice, mallory } = await loadFixture(deployFixture);
    const forged = kindling.connect(mallory).pledge(alice.publicKey, sign(mallory)).withValue(20_000n);
    await vexpect(forged.send()).rejects.toThrow(/NULLFAIL/);
  });
});

describe('Kindling: claiming', () => {
  it('does not let the creator claim before the goal is reached', async () => {
    const { kindling, creator, alice } = await loadFixture(deployFixture);
    await pledge(kindling, alice, 40_000n).send();
    await expect(claim(kindling, creator)).to.be.revertedWith(/goal not reached/);
  });

  it('does not let anyone but the creator claim', async () => {
    const { kindling, alice, bob, mallory } = await loadFixture(deployFixture);
    await pledge(kindling, alice, 30_000n).send();
    await pledge(kindling, bob, 30_000n).send();
    await vexpect(claim(kindling, mallory).send()).rejects.toThrow(/NULLFAIL/);
  });

  it('pays everything raised to the creator once the goal is met, then closes', async () => {
    const { kindling, creator, alice, bob } = await loadFixture(deployFixture);
    await pledge(kindling, alice, 30_000n).send();
    await pledge(kindling, bob, 25_000n).send();
    await expect(claim(kindling, creator)).to.emit(kindling, 'Claimed').withArgs(55_000n);
    expect((await kindling.getState()).phase).to.equal(1n);
    await expect(pledge(kindling, alice, 10_000n)).to.be.reverted;
  });

  it('sends the claim to the creator P2PKH address', async () => {
    const { kindling, creator, alice, bob } = await loadFixture(deployFixture);
    await pledge(kindling, alice, 30_000n).send();
    await pledge(kindling, bob, 25_000n).send();
    const tx = await claim(kindling, creator).send();
    expect(paidTo(tx, creator)).to.deep.include(55_000n);
  });

  it('refuses a second claim', async () => {
    const { kindling, creator, alice } = await loadFixture(deployFixture);
    await pledge(kindling, alice, 60_000n).send();
    await claim(kindling, creator).send();
    await expect(claim(kindling, creator)).to.be.reverted;
  });
});

describe('Kindling: refunds', () => {
  it('refuses refunds before the deadline', async () => {
    const { kindling, alice, deadline } = await loadFixture(deployFixture);
    await pledge(kindling, alice, 20_000n).send();
    await vexpect(refund(kindling, alice, deadline - 1n, 20_000n).send()).rejects.toThrow(/campaign still running/);
  });

  it('returns each pledge after a failed campaign, exactly once', async () => {
    const { kindling, alice, bob, deadline } = await loadFixture(deployFixture);
    await pledge(kindling, alice, 20_000n).send();
    await pledge(kindling, bob, 15_000n).send();
    await mineUpTo(deadline);

    const tx = await refund(kindling, alice, deadline, 20_000n).send();
    expect(paidTo(tx, alice)).to.deep.include(20_000n);
    expect((await kindling.getState()).raised).to.equal(15_000n);

    // Alice asks again for an amount the contract still holds (Bob's pledge).
    await vexpect(refund(kindling, alice, deadline, 15_000n).send()).rejects.toThrow(/NothingToRefund/);

    await expect(refund(kindling, bob, deadline, 15_000n)).to.emit(kindling, 'Refunded')
      .withArgs(hash160(pubkeyBin(bob)), 15_000n);
    expect((await kindling.getState()).raised).to.equal(0n);
  });

  it('refuses a refund to someone who never pledged', async () => {
    const { kindling, alice, mallory, deadline } = await loadFixture(deployFixture);
    await pledge(kindling, alice, 20_000n).send();
    await mineUpTo(deadline);
    await vexpect(refund(kindling, mallory, deadline, 20_000n).send()).rejects.toThrow(/NothingToRefund/);
  });

  it('refuses refunds when the goal was reached', async () => {
    const { kindling, alice, bob, deadline } = await loadFixture(deployFixture);
    await pledge(kindling, alice, 30_000n).send();
    await pledge(kindling, bob, 30_000n).send();
    await mineUpTo(deadline);
    await vexpect(refund(kindling, alice, deadline, 30_000n).send()).rejects.toThrow(/goal reached/);
  });

  it('refuses refunds after the creator claimed', async () => {
    const { kindling, creator, alice, deadline } = await loadFixture(deployFixture);
    await pledge(kindling, alice, 60_000n).send();
    await claim(kindling, creator).send();
    await mineUpTo(deadline);
    await vexpect(refund(kindling, alice, deadline, 600n).send()).rejects.toThrow(/CampaignClosed/);
  });
});
