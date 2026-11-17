// Deploys a Kindling campaign: `npm run solidhat:deploy -- --network chipnet`.
// KINDLING_GOAL (sats) and KINDLING_DEADLINE (block height) set the campaign; the deployer key is the creator.
import { ethers, network } from '@solidcash/solidhat/hardhat3';

const [creator] = await ethers.getSigners(1);
const height = BigInt(await ethers.provider.getBlockNumber());
const goal = BigInt(process.env.KINDLING_GOAL ?? '1000000');
const deadline = BigInt(process.env.KINDLING_DEADLINE ?? String(height + 1008n));
console.log(`Deploying Kindling on ${network.name} from ${creator.address}: goal ${goal} sats, deadline block ${deadline}`);

const Kindling = await ethers.getContractFactory('Kindling', creator);
const kindling = await Kindling.deploy(creator.publicKey, goal, deadline, {
  initialState: { raised: 0n, backers: 0n, phase: 0n },
  initialBalance: 2_000n,
});
await kindling.waitForDeployment();
const transaction = kindling.deploymentTransaction();

console.log(JSON.stringify({
  network: network.name,
  address: await kindling.getAddress(),
  transaction: transaction.txid,
  goal: goal.toString(),
  deadline: deadline.toString(),
}, null, 2));
