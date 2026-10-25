import process from 'node:process';

import type {
  Derivation,
  DerivationTerm,
  Diagnostic,
  DiagnosticLocation,
  QueryResultSolution,
  RichText,
} from '@justify/core';

import { styleErr, styleOut } from './style.ts';

function renderRich(parts: RichText): string {
  return parts
    .map(part =>
      typeof part === 'string'
        ? part
        : styleErr(part.style === 'correct' ? 'correct' : 'error', part.text),
    )
    .join('');
}

function renderLocation(location: DiagnosticLocation): string {
  switch (location.is) {
    case 'path': {
      return styleErr('path', `/${location.path.join('/')}`);
    }
    case 'line-span': {
      return `lines ${styleErr('lineNumber', `${location.start}`)}-${styleErr('lineNumber', `${location.end}`)}`;
    }
  }
}

export function renderDiagnostic(diagnostic: Diagnostic): string {
  const lines = [`${styleErr('path', diagnostic.source)}: ${renderRich(diagnostic.message)}`];

  for (const related of diagnostic.relatedLocations) {
    lines.push(`  ${related.label} ${renderLocation(related.location)}`);
  }
  for (const hint of diagnostic.hints) {
    lines.push(`  ${renderRich(hint)}`);
  }

  return lines.join('\n');
}

export function reportDiagnostics(diagnostics: ReadonlyArray<Diagnostic>): boolean {
  for (const diagnostic of diagnostics) {
    process.stderr.write(`${renderDiagnostic(diagnostic)}\n\n`);
  }
  return diagnostics.length > 0;
}

export function renderUsageError(message: string, usage: string): string {
  return `${styleErr('error', message)}\nUsage: justify ${usage}`;
}

export function renderReadError(filename: string, error: unknown): string {
  const detail =
    error instanceof Error
      ? `${error.name}: ${error.message}`
      : `fatal error: ${error?.toString()}`;
  return `${styleErr('path', filename)}, ${styleErr('error', detail)}`;
}

function prettyTerm(term: DerivationTerm): string {
  switch (term.is) {
    case 'var': {
      return styleOut('variable', `${term.id}@${term.counter}`);
    }
    case 'lit': {
      return styleOut('literal', `!${term.id}`);
    }
    case 'con': {
      return `${styleOut('constructor', term.tag)}(${term.args.map(prettyTerm).join(styleOut('separator', ', '))})`;
    }
  }
}

function prettyDerivation(indent: number, derivation: Derivation): string {
  return `${styleOut('derivation', '\u{2502} ').repeat(indent)}[${styleOut('rule', derivation.rule)}] ${styleOut('relation', derivation.relation)}(${derivation.args.map(prettyTerm).join(styleOut('separator', ', '))})`;
}

function prettyDerivationTree(indent: number, derivation: Derivation): string {
  return `${prettyDerivation(indent, derivation)}\n${derivation.premises.map(premise => prettyDerivationTree(indent + 1, premise)).join('')}`;
}

export function prettySolution(solution: QueryResultSolution): string {
  let output = '';
  for (const [meta, binding] of Object.entries(solution.variables)) {
    output += `${meta} = ${prettyTerm(binding)}\n`;
  }
  if (solution.derivation !== undefined) {
    output += prettyDerivationTree(0, solution.derivation);
  }
  return output;
}
