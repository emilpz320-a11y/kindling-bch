/* eslint-disable */
import '@solidcash/testing/hre';

declare module '@solidcash/testing/hre' {
  interface SolidcashArtifactMap {
    'Kindling': typeof import('../artifacts/solidcash/contracts/Kindling.scash/Kindling.artifact.js').default;
  }
}

export {};
