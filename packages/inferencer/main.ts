// This file will be removed, replaced with the @justify/cli package
// deno-lint-ignore-file no-external-import no-console
import * as util from 'node:util';
import { default as process } from 'node:process';
import { parseQuery, parseSystem } from '@justify/core';
import type { RuleLog, Term } from './mk.ts';
import { performQuery } from './lib.ts';

function machineTerm(term: Term): string {
  switch (term.is) {
    case 'var':
      return `{"is":"var","id":"${term.id}","counter":${term.counter}}`;
    case 'lit':
      return `{"is":"lit","id":"${term.id}"}`;
    case 'con':
      return `{"is":"con","from":"${term.from}","tag":"${term.tag}","args":[${term.args.map(machineTerm).join(',')}]}`;
  }
}

function machineLog(log: RuleLog): string {
  return ('{' + [
    `"relation":"${log.relation}"`,
    `"rule":"${log.rule}"`,
    `"args":[${log.args.map(machineTerm).join(',')}]`,
    `"premises":[${log.premises.map(machineLog).join(',')}]`
  ].join(',') + '}');
}

function prettyTerm(term: Term): string {
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

function prettyLog(log: RuleLog): string {
  const single = (indent: number, l: RuleLog): string => (
    util.styleText('gray', '\u{2502} ').repeat(indent) +
    '[' + util.styleText('green', l.rule) + '] ' +
    util.styleText('cyan', l.relation) +
    '(' + l.args.map(prettyTerm).join(util.styleText('bold', ', ')) + ')'
  );

  const loop = (indent: number, l: RuleLog): string =>
    `${single(indent, l)}\n${l.premises.map((p) => loop(indent + 1, p)).join("")}`;

  return loop(0, log);
}

async function main(): Promise<void> {
  if (process.argv.length !== 4 && process.argv.length !== 5) {
    console.error(`Wrong number of arguments.\nUsage: ${process.argv[1]} [-m] system-file query-file`);
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
    [_node, _source, flags, systemFile, queryFile] = process.argv as [string, string, string, string, string];
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

  const queryResult = performQuery(system, query);

  if (typeof queryResult === 'string') {
    console.error(queryResult);
    process.exitCode = 1;
    return;
  } else {
    if (machineReadable) {
      console.log('['+queryResult.map(machineLog).join(',')+']')
    } else {
      console.log(queryResult.map(prettyLog).join('\n'));
    }
  }
}
main();
