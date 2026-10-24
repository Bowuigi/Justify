import { default as process } from 'node:process';

import { parseSystem } from '@justify/core';

import { extractTeX } from './lib.ts';

async function main(): Promise<void> {
  if (process.argv.length !== 3) {
    console.error(`Wrong number of arguments.\nUsage: ${process.argv[1]} filename`);
    process.exitCode = 1;
    return;
  }

  const [filename] = process.argv.toSpliced(0, 2) as [string];

  const system = await parseSystem(filename);
  if (system === null) {
    process.exitCode = 1;
    return;
  }
  console.log(extractTeX(system));
}
await main();
