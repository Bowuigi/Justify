import { default as process } from 'node:process';
import { styleText } from 'node:util';

import {
  type Derivation,
  type DerivationTerm,
  parseQuery,
  parseSystem,
  type QueryResult,
  type QueryResultSolution,
} from '@justify/core';

import { performQuery } from './lib.ts';

function prettyTerm(term: DerivationTerm): string {
  switch (term.is) {
    case 'var': {
      return styleText('magenta', `${term.id}@${term.counter}`);
    }
    case 'lit': {
      return styleText('yellow', `!${term.id}`);
    }
    case 'con': {
      return `${styleText('blue', term.tag)}(${term.args.map(prettyTerm).join(styleText('bold', ', '))})`;
    }
  }
}

function prettySolution(solution: QueryResultSolution): string {
  const prettyDerivation = (indent: number, l: Derivation): string =>
    `${styleText('gray', '\u{2502} ').repeat(indent)}[${styleText('green', l.rule)}] ${styleText('cyan', l.relation)}(${l.args.map(prettyTerm).join(styleText('bold', ', '))})`;

  const loop = (indent: number, l: Derivation): string =>
    `${prettyDerivation(indent, l)}\n${l.premises.map(p => loop(indent + 1, p)).join('')}`;

  let output = '';
  for (const [meta, binding] of Object.entries(solution.variables)) {
    output += `${meta} = ${prettyTerm(binding)}\n`;
  }
  if (solution.derivation !== undefined) {
    output += loop(0, solution.derivation);
  }
  return output;
}

async function main(): Promise<void> {
  if (process.argv.length !== 4 && process.argv.length !== 5) {
    console.error(
      `Wrong number of arguments.\nUsage: ${process.argv[1]} [-m] system-file query-file`,
    );
    process.exitCode = 1;
    return;
  }

  let machineReadable = false;
  // oxlint-disable-next-line init-declarations
  let flags: string, systemFile: string, queryFile: string;
  if (process.argv.length === 4) {
    // Depends on the check above
    [systemFile, queryFile] = process.argv.toSpliced(0, 2) as [string, string];
  } else {
    // Depends on the check above
    [flags, systemFile, queryFile] = process.argv.toSpliced(0, 2) as [string, string, string];
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
    console.error(solutions);
    process.exitCode = 1;
    return;
  }

  const result: QueryResult = { solutions, count: solutions.length };
  if (machineReadable) {
    console.log(JSON.stringify(result));
  } else {
    console.log(solutions.map(sol => prettySolution(sol)).join('\n'));
  }
}

await main();
