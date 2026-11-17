// Prints both outcomes of a Kindling campaign on the strict mock network: `node demo/cli.ts`.
import { KindlingDemo } from './kindling-demo.ts';

async function scenario(title: string, steps: (demo: KindlingDemo) => Promise<void>): Promise<void> {
  const demo = new KindlingDemo(50_000n);
  await demo.deploy(10);
  await steps(demo);
  console.log(`\n== ${title}`);
  for (const entry of [...demo.log].reverse()) {
    console.log(`${entry.ok ? 'ok  ' : 'NO  '} ${entry.action.padEnd(16)} ${entry.detail}`);
  }
  const s = await demo.snapshot();
  console.log(`state: raised=${s.raised} backers=${s.backers} phase=${s.phase} height=${s.height}/${s.deadline}`);
}

await scenario('funded campaign', async (d) => {
  await d.pledge('alice', 30_000n);
  await d.claim('alice');
  await d.claim('creator');
  await d.pledge('bob', 25_000n);
  await d.claim('creator');
  await d.pledge('alice', 10_000n);
});

await scenario('failed campaign', async (d) => {
  await d.pledge('alice', 20_000n);
  await d.pledge('bob', 15_000n);
  await d.refund('alice');
  await d.mine(10);
  await d.refund('alice');
  await d.refund('alice');
  await d.refund('bob');
});
