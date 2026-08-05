// deno-lint-ignore no-external-import
import * as util from 'node:util';
// deno-lint-ignore no-external-import
import { default as process } from 'node:process';
import { type Derivation, type DerivationTerm, parseQuery, parseSystem, type QueryResult, type QueryResultSolution } from '@justify/core';
import { performQuery } from './lib.ts';

function prettyTerm(term: DerivationTerm): string {
  switch (term.is) {
    case 'var':
      return util.styleText('magenta', `${term.id}@${term.counter}`);
    case 'lit':
      return util.styleText('yellow', `!${term.id}`);
    case 'con':
      return (
        util.styleText('blue', term.tag) +
        '(' + term.args.map(prettyTerm).join(util.styleText('bold', ', ')) + ')'
      );
  }
}

function prettySolution(solution: QueryResultSolution): string {
  const prettyDerivation = (indent: number, l: Derivation): string => (
    util.styleText('gray', '\u{2502} ').repeat(indent) +
    '[' + util.styleText('green', l.rule) + '] ' +
    util.styleText('cyan', l.relation) +
    '(' + l.args.map(prettyTerm).join(util.styleText('bold', ', ')) + ')'
  );

  const loop = (indent: number, l: Derivation): string =>
    `${prettyDerivation(indent, l)}\n${l.premises.map((p) => loop(indent + 1, p)).join('')}`;

  let output = '';
  for (const [meta, binding] of Object.entries(solution.variables)) {
    output += `${meta} = ${prettyTerm(binding)}\n`
  }
  if (solution.derivation !== undefined) {
    output += loop(0, solution.derivation)
  }
  return output;
}

async function main(): Promise<void> {
  if (process.argv.length !== 4 && process.argv.length !== 5) {
    // deno-lint-ignore no-console
    console.error(
      `Wrong number of arguments.\nUsage: ${process.argv[1]} [-m] system-file query-file`
    );
    process.exitCode = 1;
    return;
  }

  let machineReadable = false;
  // @ts-ignore 6133 (_node and _source are unused on purpose)
  // deno-lint-ignore single-var-declarator
  let _node: string, _source: string, flags: string, systemFile: string, queryFile: string;
  if (process.argv.length === 4) {
    // Cast added due to deno-lsp complaints
    [_node, _source, systemFile, queryFile] = process.argv as [string, string, string, string];
  } else {
    // Cast added due to deno-lsp complaints
    [_node, _source, flags, systemFile, queryFile] = process.argv as [
      string,
      string,
      string,
      string,
      string
    ];
    if (flags.includes('m')) {
      machineReadable = true;
    }
  }

  const system = await parseSystem(systemFile);
  const query = await parseQuery(queryFile);

  if (system === null || query === null) {
    process.exitCode = 1;
    return;
  }

  const solutions = performQuery(system, query);

  if (typeof solutions === 'string') {
    // deno-lint-ignore no-console
    console.error(solutions);
    process.exitCode = 1;
    return;
  } else {
    const result: QueryResult = { solutions, count: solutions.length };
    if (machineReadable) {
      // deno-lint-ignore no-console
      console.log(JSON.stringify(result));
    } else {
      // deno-lint-ignore no-console
      console.log(solutions.map(prettySolution).join('\n'));
    }
  }
}
main();
