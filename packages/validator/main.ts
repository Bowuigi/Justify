import { parseQuery, parseQueryResult, parseSystem } from '@justify/core';
import { validateQuery, validateQueryResult, validateSystem } from './driver.ts';
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
      } {system|query|query-result} filenames...`
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

  if (!['system', 'query', 'query-result'].includes(format)) {
    // deno-lint-ignore no-console
    console.error(
      `Unknown format specifier '${format}'.\nUsage: ${
        process.argv[1]
      } {system|query|query-result} filename`
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
    case 'query-result': {
      if (rest.length !== 2) {
        // deno-lint-ignore no-console
        console.error(
          `Wrong number of arguments.\nUsage: ${
            process.argv[1]
          } query-result system-filename query-result-filename`
        );
        process.exitCode = 1;
        return;
      }
      // deno-lint-ignore no-non-null-assertion
      const system = await parseSystem(rest[0]!);
      // deno-lint-ignore no-non-null-assertion
      const queryResult = await parseQueryResult(rest[1]!);
      if (system === null || queryResult === null) {
        process.exitCode = 1;
        return;
      }
      // deno-lint-ignore no-console
      console.log(
        validateQueryResult(queryResult, system).map(renderMEI).join('\n') || 'All good!'
      );
      break;
    }
      // every other case is unreachable
  }
}
main();
