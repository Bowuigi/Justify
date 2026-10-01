import { readFile } from 'node:fs/promises';
import { default as process } from 'node:process';
import { inspect } from 'node:util';

import {
  metadataExtension,
  relationMetaExtension,
  relationRuleExtension,
  syntaxExtension,
} from './extensions.ts';
import { runPipeline, type Extension } from './mod.ts';

async function main(): Promise<void> {
  if (process.argv.length !== 3) {
    console.error(`Wrong number of arguments.\nUsage: ${process.argv[1]} filename.jtf.md`);
    process.exitCode = 1;
    return;
  }

  const filename = process.argv[2]!;
  const contents = await readFile(filename);
  const extensions: Array<Extension> = [
    metadataExtension,
    syntaxExtension,
    relationMetaExtension,
    relationRuleExtension,
  ];
  const result = runPipeline(contents, extensions);

  console.log(inspect(result, false, Infinity, true));
}
await main();
