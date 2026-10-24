import { styleText } from 'node:util';

import type { Derivation, DerivationTerm, QueryResultSolution } from '@justify/core';

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

export function prettySolution(solution: QueryResultSolution): string {
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
