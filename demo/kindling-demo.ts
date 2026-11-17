/* eslint-disable @typescript-eslint/no-explicit-any */
// Runs the whole Kindling lifecycle with the SolidCash SDK on an in-process mock network that applies
// BCH mainnet limits. Used by the web demo and by `npm run demo:cli`.
import {
  binToHex, encodeLockingBytecodeP2pkh, generatePrivateKey, hash160, lockingBytecodeToCashAddress, secp256k1,
} from '@bitauth/libauth';
import { SignatureTemplate, Signer } from '@solidcash/solidcash';
import { StatefulContract } from '@solidcash/solidcash/stateful';
import { MockNetworkProvider } from '@solidcash/solidcash/network/mock';
import artifact from '../artifacts/solidcash/Kindling.json' with { type: 'json' };

export type PartyName = 'creator' | 'alice' | 'bob';

interface Party {
  name: PartyName;
  priv: Uint8Array;
  pub: Uint8Array;
  pkh: Uint8Array;
  lock: Uint8Array;
  address: string;
  signer: Signer;
}

export interface LogEntry {
  action: string;
  ok: boolean;
  detail: string;
  txid?: string;
}

export interface Snapshot {
  height: number;
  deadline: number;
  goal: bigint;
  raised: bigint;
  backers: bigint;
  phase: 'Open' | 'Claimed';
  pledges: Record<'alice' | 'bob', bigint>;
}

const STRICT_LIMITS = {
  maximumInputBytes: 10_000,
  maximumStackItemBytes: 10_000,
  maximumTransactionBytes: 100_000,
  maximumNftCommitmentBytes: 128,
};

// Turns a failed script evaluation into the contract rule that refused it.
function explain(message: string): string {
  if (/NULLFAIL/.test(message)) return 'signature does not match the key the contract checks (checkSig)';
  const named = /require failed: (\w+)\(/.exec(message)?.[1];
  if (named) return named;
  const reason = /require: ([^;]+)$/.exec(message)?.[1] ?? /failing require in Kindling:\d+ \((.+)\)$/.exec(message)?.[1];
  if (reason) return reason.trim();
  if (/below dust|exceeds satoshi container/i.test(message)) return 'amount not available in the contract';
  return message.slice(0, 200);
}

const randomKey = (): Uint8Array => generatePrivateKey(() => crypto.getRandomValues(new Uint8Array(32)));

export class KindlingDemo {
  readonly provider: any;
  readonly parties: Record<PartyName, Party>;
  readonly goal: bigint;
  readonly log: LogEntry[] = [];
  deadline = 0;
  contract: any;
  private pledged: Record<'alice' | 'bob', bigint> = { alice: 0n, bob: 0n };
  private seed = 0x100;

  constructor(goal = 50_000n) {
    this.goal = goal;
    this.provider = new MockNetworkProvider({ consensusLimits: STRICT_LIMITS, policy: { enforceDust: true } } as any);
    const make = (name: PartyName): Party => {
      const priv = randomKey();
      const pub = secp256k1.derivePublicKeyCompressed(priv) as Uint8Array;
      const pkh = hash160(pub);
      const lock = encodeLockingBytecodeP2pkh(pkh);
      const address = lockingBytecodeToCashAddress({ bytecode: lock, prefix: 'bchtest' });
      if (typeof address === 'string') throw new Error(address);
      return { name, priv, pub, pkh, lock, address: address.address, signer: new Signer(priv, this.provider) };
    };
    this.parties = { creator: make('creator'), alice: make('alice'), bob: make('bob') };
  }

  private nextTxid(): string {
    this.seed += 1;
    return this.seed.toString(16).padStart(64, '0');
  }

  private async fund(party: Party, coins = 2, satoshis = 500_000n): Promise<void> {
    for (let i = 0; i < coins; i += 1) {
      await this.provider.seedUtxo(binToHex(party.lock), { txid: this.nextTxid(), vout: 0, satoshis });
    }
  }

  private async record<T>(action: string, run: () => Promise<T>, describe: (r: T) => string): Promise<boolean> {
    try {
      const result: any = await run();
      this.log.unshift({ action, ok: true, detail: describe(result), txid: result?.txid });
      return true;
    } catch (error: any) {
      const message = String(error?.message ?? error).split('\n')[0];
      this.log.unshift({ action, ok: false, detail: `refused by the contract: ${explain(message)}` });
      return false;
    }
  }

  async deploy(blocksUntilDeadline = 10): Promise<boolean> {
    await this.fund(this.parties.creator, 3);
    await this.fund(this.parties.alice);
    await this.fund(this.parties.bob);
    this.deadline = (await this.provider.getBlockHeight()) + blocksUntilDeadline;
    const creator = this.parties.creator;
    const fundingUtxo = { txid: this.nextTxid(), vout: 0, satoshis: 1_000_000n };
    await this.provider.seedUtxo(binToHex(creator.lock), fundingUtxo);
    return this.record('deploy', async () => {
      const { contract } = await StatefulContract.deploy(
        artifact as any,
        [creator.pub, this.goal, BigInt(this.deadline)],
        {
          provider: this.provider,
          fundingUtxo,
          funder: new SignatureTemplate(creator.priv).unlockP2PKH(),
          changeAddress: creator.address,
          senderLockingBytecode: creator.lock,
          initialState: { raised: 0n, backers: 0n, phase: 0n },
          initialBalance: 2_000n,
        } as any,
      );
      this.contract = contract;
      return { txid: undefined };
    }, () => `campaign open: goal ${this.goal} sats, deadline at block ${this.deadline}`);
  }

  async pledge(who: 'alice' | 'bob', amount: bigint): Promise<boolean> {
    const party = this.parties[who];
    return this.record(`pledge (${who})`, async () => {
      const tx = await this.contract.connect(party.signer).call
        .pledge(party.pub, new SignatureTemplate(party.priv)).withValue(amount).send();
      this.pledged[who] += amount;
      return tx;
    }, () => `${who} pledged ${amount} sats`);
  }

  async claim(who: PartyName = 'creator'): Promise<boolean> {
    const party = this.parties[who];
    return this.record(`claim (${who})`, async () => {
      const raised = (await this.state()).raised;
      const tx = await this.contract.connect(party.signer).call.claim(new SignatureTemplate(party.priv)).send();
      return { ...tx, raised };
    }, (r: any) => `creator received ${r.raised} sats`);
  }

  async refund(who: 'alice' | 'bob'): Promise<boolean> {
    const party = this.parties[who];
    // The refund pays the backer's pledge; ask for what this backer put in (0 → the contract refuses).
    const amount = this.pledged[who] > 0n ? this.pledged[who] : 10_000n;
    return this.record(`refund (${who})`, async () => {
      const tx = await this.contract.connect(party.signer).call
        .refund(party.pub, new SignatureTemplate(party.priv))
        .setLocktime(Math.min(await this.provider.getBlockHeight(), this.deadline))
        .transfer(party.lock, amount)
        .send();
      this.pledged[who] = 0n;
      return tx;
    }, () => `${who} got ${amount} sats back`);
  }

  async mine(blocks: number): Promise<void> {
    await this.provider.mine(blocks);
    this.log.unshift({ action: 'mine', ok: true, detail: `mined ${blocks} block(s), height ${await this.provider.getBlockHeight()}` });
  }

  async state(): Promise<{ raised: bigint; backers: bigint; phase: bigint }> {
    return (await this.contract.getState()) as any;
  }

  async snapshot(): Promise<Snapshot> {
    const state = this.contract ? await this.state() : { raised: 0n, backers: 0n, phase: 0n };
    return {
      height: await this.provider.getBlockHeight(),
      deadline: this.deadline,
      goal: this.goal,
      raised: BigInt(state.raised),
      backers: BigInt(state.backers),
      phase: BigInt(state.phase) === 0n ? 'Open' : 'Claimed',
      pledges: { ...this.pledged },
    };
  }
}
