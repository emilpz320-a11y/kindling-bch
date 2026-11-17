# Kindling

All-or-nothing crowdfunding on Bitcoin Cash, written in Solidity syntax and compiled natively to BCH Script with
[SolidCash](https://github.com/solidcash/solidcash) 0.51.0.

A creator opens a campaign with a goal (in satoshis) and a deadline (a block height). Backers pledge BCH into the
contract. If the goal is reached, the creator claims everything raised. If the deadline passes first, every backer can
take their own pledge back. Nobody, including the creator, can move a backer's pledge anywhere else.

Built for the BCH BLAZE 2026 bounty "Best SolidCash Application".

## The contract

[`contracts/Kindling.scash`](contracts/Kindling.scash) is a stateful SolidCash contract: its state lives in CashToken
NFT commitments and its BCH in a single satoshi-container coin.

| Entry | Who | Rule |
| --- | --- | --- |
| `pledge(pubkey backer, sig s) payable` | any backer | signed by `backer`; at least 10,000 sats; campaign still open; credits `msg.value` to `hash160(backer)` |
| `claim(sig s)` | creator | signed by the creator key; `raised >= goal`; pays `raised` to the creator's P2PKH and closes the campaign |
| `refund(pubkey backer, sig s)` | a backer | signed by `backer`; `tx.time >= deadline`; goal not reached; pays that backer's pledge back to their P2PKH, once |

SolidCash features it uses:

- stateful contract: `int` state fields, an `enum Phase` field, and a verified `mapping(bytes20 => int)` of pledges
  (every read proves the stored value or the key's absence, so a transaction builder cannot hide an entry);
- `payable` entry and `msg.value`, `this.transfer(...)` from the satoshi container, `pragma satoshicontainer single`;
- an `abstract contract` base with constructor parameters and a `modifier onlyCreator(sig)`, plus a `whileOpen`
  modifier;
- a `library` attached with `using PledgeMath for int`;
- `constant`, events (`Pledged`, `Claimed`, `Refunded`) emitted as NFT records, custom errors (`PledgeTooSmall`,
  `CampaignClosed`, `NothingToRefund`) and `require` messages;
- an absolute time lock, `require(tx.time >= deadline)` (OP_CHECKLOCKTIMEVERIFY);
- `checkSig` authorization everywhere instead of `msg.sender`, `hash160` and `new LockingBytecodeP2PKH(...)`.

The compiled script is 4,072 bytes, under BCH's 10,000-byte input limit, and its state fits 128-byte commitments.

## Tests

The tests run on a mock network that applies BCH mainnet limits (`strict` in [`solidcash.config.ts`](solidcash.config.ts):
10,000-byte inputs and stack items, 100,000-byte transactions, 128-byte NFT commitments, dust and standardness rules).

```sh
npm install
npm run solidhat:test
```

[`test/Kindling.test.ts`](test/Kindling.test.ts) has 14 tests: pledging and repeat pledges, events and their
arguments, the minimum pledge, a pledge signed by someone other than the credited backer, claims before the goal, by a
non-creator, a second claim, the creator's payout, refunds before the deadline, after the goal, after a claim, to a
non-backer, and a double refund. Each failure is checked against the rule that should refuse it, not only "it failed".

## Demo

```sh
npm run demo:dev     # web page at http://localhost:5173
npm run demo:cli     # both outcomes printed in the terminal
```

The page runs the SolidCash SDK in the browser on the same strict mock network: deploy a campaign, pledge as Alice or
Bob, try to claim as Alice, claim as the creator, mine blocks past the deadline and ask for refunds. Each step builds,
signs and VM-checks a real BCH transaction; the log shows which contract rule refused a step.

## Deploy

```sh
SOLIDCASH_MNEMONIC_CHIPNET="..." KINDLING_GOAL=1000000 KINDLING_DEADLINE=<height> \
  npm run solidhat:deploy -- --network chipnet
```

The deployer key becomes the creator. Use `--network mainnet` with `SOLIDCASH_MNEMONIC_MAINNET` for mainnet. Never
fund the public development mnemonic.

## SolidCash finding

A stateful call that checks `tx.time` and then pays from the satoshi container, sent with `.setLocktime()` and no
manual `.transfer()`, failed during the SDK's automatic derivation. The first derivation probe runs before the
locktime is applied and stops at the CLTV check; the re-derivation with the locktime did not derive transfers. This
project passes `.transfer()` explicitly in `refund` as a workaround, and the fix is proposed upstream to
[solidcash/solidcash](https://github.com/solidcash/solidcash).

## Security notes

- Beta compiler (0.51.0, no outside audit). Do not put significant value behind this contract without a review.
- Pledges are still accepted after the deadline while the campaign is open; they can then be claimed (if the goal is
  reached) or refunded like any other pledge.
- After the deadline, if the goal was not reached, the creator can still claim if new pledges reach the goal before
  backers withdraw. Refunds and claims race for the same state coin; only one transaction confirms.

## License

MIT
