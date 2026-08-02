import { parseDerivationTree, parseQuery, parseSystem } from '@justify/core';
import { validateDerivationTree, validateQuery, validateSystem } from './driver.ts';
import type { ModuleErrorInfo } from './module-common.ts';
// deno-lint-ignore no-external-import
import { default as process } from 'node:process';
// deno-lint-ignore no-external-import
import { styleText } from 'node:util';

function renderMEI(mei: ModuleErrorInfo): string {
  const fromPath = (p: Array<unknown>): string => styleText('yellow', '/' + p.join('/'));
  let output = `Error: ${mei.message}\n`;
  output += `  In ${fromPath(mei.location)}\n`;

  if (mei.sourceOfTruthLocation !== null) {
    output += `  Conflicts with ${fromPath(mei.sourceOfTruthLocation)}\n`;
  }

  for (const hint of mei.hints) {
    output += `  ${hint}\n`;
  }

  return output;
}

async function main(): Promise<void> {
  if (process.argv.length < 3) {
    // deno-lint-ignore no-console
    console.error(
      `Wrong number of arguments.\nUsage: ${
        process.argv[1]
      } {system|query|derivation-tree} filenames...`
    );
    process.exitCode = 1;
    return;
  }

  // This cast depends on the check above
  const [_node, _source, format, ...rest] = process.argv as [
    string,
    string,
    string,
    ...Array<string>
  ];

  if (!['system', 'query', 'derivation-tree'].includes(format)) {
    // deno-lint-ignore no-console
    console.error(
      `Unknown format specifier '${format}'.\nUsage: ${
        process.argv[1]
      } {system|query|derivation-tree} filename`
    );
    process.exitCode = 1;
    return;
  }

  switch (format) {
    case 'system': {
      if (rest.length !== 1) {
        // deno-lint-ignore no-console
        console.error(`Wrong number of arguments.\nUsage: ${process.argv[1]} system filename`);
        process.exitCode = 1;
        return;
      }
      // deno-lint-ignore no-non-null-assertion
      const system = await parseSystem(rest[0]!);
      if (system === null) {
        process.exitCode = 1;
        return;
      }
      // deno-lint-ignore no-console
      console.log(validateSystem(system).map(renderMEI).join('\n') || 'All good!');
      break;
    }
    case 'query': {
      if (rest.length !== 2) {
        // deno-lint-ignore no-console
        console.error(
          `Wrong number of arguments.\nUsage: ${
            process.argv[1]
          } query system-filename query-filename`
        );
        process.exitCode = 1;
        return;
      }
      // deno-lint-ignore no-non-null-assertion
      const system = await parseSystem(rest[0]!);
      // deno-lint-ignore no-non-null-assertion
      const query = await parseQuery(rest[1]!);
      if (system === null || query === null) {
        process.exitCode = 1;
        return;
      }
      // deno-lint-ignore no-console
      console.log(validateQuery(query, system).map(renderMEI).join('\n') || 'All good!');
      break;
    }
    case 'derivation-tree': {
      if (rest.length !== 2) {
        // deno-lint-ignore no-console
        console.error(
          `Wrong number of arguments.\nUsage: ${
            process.argv[1]
          } derivation-tree system-filename derivation-tree-filename`
        );
        process.exitCode = 1;
        return;
      }
      // deno-lint-ignore no-non-null-assertion
      const system = await parseSystem(rest[0]!);
      // deno-lint-ignore no-non-null-assertion
      const drvTree = await parseDerivationTree(rest[1]!);
      if (system === null || drvTree === null) {
        process.exitCode = 1;
        return;
      }
      // deno-lint-ignore no-console
      console.log(validateDerivationTree(drvTree, system).map(renderMEI).join('\n') || 'All good!');
      break;
    }
      // every other case is unreachable
  }
}
main();
