import { KindlingDemo } from './kindling-demo.ts';

const $ = (id: string): HTMLElement => document.getElementById(id)!;
const fmt = (n: bigint | number): string => Number(n).toLocaleString('en-US');
let demo: KindlingDemo | undefined;
let busy = false;

function setBusy(on: boolean, label = ''): void {
  busy = on;
  $('busy').textContent = on ? label : '';
  document.querySelectorAll('button').forEach((b) => { (b as HTMLButtonElement).disabled = on; });
}

async function render(): Promise<void> {
  if (!demo) return;
  const s = await demo.snapshot();
  $('phase').textContent = s.phase === 'Open' ? 'open' : 'claimed by creator';
  $('raised').textContent = fmt(s.raised);
  $('goal').textContent = fmt(s.goal);
  $('backers').textContent = fmt(s.backers);
  $('blocks').textContent = s.deadline > s.height ? String(s.deadline - s.height) : 'passed';
  const pct = Math.min(100, Number((s.raised * 100n) / s.goal));
  ($('progress') as HTMLElement).style.width = `${pct}%`;
  $('progress-label').textContent = `${pct}% of goal · block ${s.height}, deadline ${s.deadline}`;
  $('log').innerHTML = demo.log.map((e) => `<li><b class="${e.ok ? 'ok' : 'bad'}">${e.ok ? '✓' : '✗'} ${e.action}</b>${
    escapeHtml(e.detail)}${e.txid ? ` <span class="muted">· tx ${e.txid.slice(0, 12)}…</span>` : ''}</li>`).join('');
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
}

async function run(label: string, action: () => Promise<unknown>): Promise<void> {
  if (busy) return;
  setBusy(true, `${label}…`);
  try {
    await action();
  } finally {
    setBusy(false);
    await render();
  }
}

$('deploy').addEventListener('click', () => run('deploying', async () => {
  demo = new KindlingDemo(50_000n);
  await demo.deploy(10);
}));

document.querySelectorAll<HTMLButtonElement>('button[data-act]').forEach((button) => {
  button.addEventListener('click', () => {
    if (!demo?.contract) return;
    const { act, who, n } = button.dataset;
    if (act === 'pledge') {
      const amount = BigInt((document.getElementById(`${who}-amount`) as HTMLInputElement).value || '0');
      void run(`${who} pledging`, () => demo!.pledge(who as 'alice' | 'bob', amount));
    } else if (act === 'refund') {
      void run(`${who} asking for a refund`, () => demo!.refund(who as 'alice' | 'bob'));
    } else if (act === 'claim') {
      void run(`${who} claiming`, () => demo!.claim(who as 'creator' | 'alice'));
    } else if (act === 'mine') {
      void run('mining', () => demo!.mine(Number(n)));
    }
  });
});
