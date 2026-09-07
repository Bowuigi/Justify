// oxlint-disable no-console
import { default as process } from 'node:process';
import { styleText } from 'node:util';

import { parseQuery, parseQueryResult, parseSystem } from '@justify/core';

import { validateQuery, validateQueryResult, validateSystem } from './driver.ts';
import type { ModuleErrorInfo } from './module-common.ts';

function renderMEI(mei: ModuleErrorInfo): string {
  const fromPath = (p: Array<unknown>): string => styleText('yellow', `/${p.join('/')}`);
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

// This whole file is temporary, to be replaced with @justify/cli
// oxlint-disable-next-line max-lines-per-function
async function main(): Promise<void> {
  if (process.argv.length < 3) {
    console.error(
      `Wrong number of arguments.\nUsage: ${
        process.argv[1]
      } {system|query|query-result} filenames...`,
    );
    process.exitCode = 1;
    return;
  }

  // This cast depends on the check above
  // oxlint-disable-next-line no-unsafe-type-assertion
  const [format, ...rest] = process.argv.toSpliced(2) as [string, ...Array<string>];

  if (!['system', 'query', 'query-result'].includes(format)) {
    console.error(
      `Unknown format specifier '${format}'.\nUsage: ${
        process.argv[1]
      } {system|query|query-result} filename`,
    );
    process.exitCode = 1;
    return;
  }

  switch (format) {
    case 'system': {
      if (rest.length !== 1) {
        console.error(`Wrong number of arguments.\nUsage: ${process.argv[1]} system filename`);
        process.exitCode = 1;
        return;
      }
      const system = await parseSystem(rest[0]!);
      if (system === null) {
        process.exitCode = 1;
        return;
      }
      console.log(
        validateSystem(system)
          .map(mei => renderMEI(mei))
          .join('\n') || 'All good!',
      );
      break;
    }
    case 'query': {
      if (rest.length !== 2) {
        console.error(
          `Wrong number of arguments.\nUsage: ${
            process.argv[1]
          } query system-filename query-filename`,
        );
        process.exitCode = 1;
        return;
      }
      const system = await parseSystem(rest[0]!);
      const query = await parseQuery(rest[1]!);
      if (system === null || query === null) {
        process.exitCode = 1;
        return;
      }
      console.log(
        validateQuery(query, system)
          .map(mei => renderMEI(mei))
          .join('\n') || 'All good!',
      );
      break;
    }
    case 'query-result': {
      if (rest.length !== 2) {
        console.error(
          `Wrong number of arguments.\nUsage: ${
            process.argv[1]
          } query-result system-filename query-result-filename`,
        );
        process.exitCode = 1;
        return;
      }
      const system = await parseSystem(rest[0]!);
      const queryResult = await parseQueryResult(rest[1]!);
      if (system === null || queryResult === null) {
        process.exitCode = 1;
        return;
      }
      console.log(
        validateQueryResult(queryResult, system)
          .map(mei => renderMEI(mei))
          .join('\n') || 'All good!',
      );
      break;
    }
    // Every other case is unreachable
  }
}
await main();
