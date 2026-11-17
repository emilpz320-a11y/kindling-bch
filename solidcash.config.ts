import { defineConfig } from '@solidcash/solidhat/config';

export default defineConfig({
  paths: {
    contracts: 'contracts',
    artifacts: 'artifacts',
    tests: 'test',
  },
  compiler: {},
  typegen: {
    targets: [{ target: 'ethers6', layout: 'typechain', outDir: 'typechain-types' }],
  },
  mnemonic: process.env.SOLIDCASH_MNEMONIC,
  accounts: { count: 4, satoshis: 100_000_000n },
  networks: {
    mock: { type: 'mock' },
    // Mock with BCH mainnet limits, so tests and artifacts match what the real network accepts.
    strict: {
      type: 'mock',
      consensus: {
        maximumInputBytes: 10_000,
        maximumStackItemBytes: 10_000,
        maximumTransactionBytes: 100_000,
        maximumNftCommitmentBytes: 128,
      },
      policy: { enforceDust: true },
    },
    regtest: {
      type: 'regtest',
      rpc: {
        url: process.env.REGTEST_RPC_URL ?? 'http://127.0.0.1:18443',
        user: process.env.REGTEST_RPC_USER ?? 'user',
        password: process.env.REGTEST_RPC_PASSWORD ?? 'password',
      },
    },
    chipnet: { type: 'electrum', network: 'chipnet', mnemonic: process.env.SOLIDCASH_MNEMONIC_CHIPNET },
    mainnet: { type: 'electrum', network: 'mainnet', mnemonic: process.env.SOLIDCASH_MNEMONIC_MAINNET },
  },
  defaultNetwork: 'strict',
});
