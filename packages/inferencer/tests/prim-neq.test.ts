import type { Derivation, Query, QueryResultSolution, System, Term, TermCon } from '@justify/core';
import { describe, expect, it } from 'vitest';

import { performQuery } from '../lib.ts';

function ref(to: string): Term {
  return { is: 'ref', to };
}

function con(from: string, tag: string, args: Array<Term>): TermCon {
  return { is: 'con', from, tag, args };
}

function query(relation: string, args: Array<Term>, variables: Array<string> = []): Query {
  return {
    relation,
    max_results: 1,
    variables: Object.fromEntries(variables.map(variable => [variable, variable])),
    literals: {},
    args,
  };
}

const zero = con('value', 'zero', []);
const successor = con('value', 'succ', [zero]);

function pair(left: Term, right: Term): TermCon {
  return con('value', 'pair', [left, right]);
}

const fixtureSystem = {
  description: 'A minimal system for prim_neq premise tests',
  syntax: {
    value: {
      description: 'Values',
      suggestions: ['v'],
      grammar: [
        {
          id: 'zero',
          description: 'The zero value',
          tex_parts: ['0'],
          fixity: 'none',
          arguments: [],
        },
        {
          id: 'succ',
          description: 'The successor of a value',
          tex_parts: ['S'],
          fixity: 'prefix',
          arguments: [{ from: 'value', id: 'value', tex: 'v' }],
        },
        {
          id: 'pair',
          description: 'A pair of values',
          tex_parts: ['(', ',', ')'],
          fixity: 'infix',
          arguments: [
            { from: 'value', id: 'left', tex: 'l' },
            { from: 'value', id: 'right', tex: 'r' },
          ],
        },
      ],
    },
  },
  relations: {
    different: {
      description: 'Two different values',
      tex_parts: [],
      fixity: 'none',
      arguments: [
        { from: 'value', id: 'left', tex: 'l' },
        { from: 'value', id: 'right', tex: 'r' },
      ],
      rules: [
        {
          rule: { id: 'diff', tex: 'Diff' },
          variables: { left: 'l', right: 'r' },
          literals: {},
          patterns: { left: ref('left'), right: ref('right') },
          premises: [{ relation: 'prim_neq', args: [ref('left'), ref('right')] }],
        },
      ],
    },
    differentPair: {
      description: 'A pair with different values',
      tex_parts: [],
      fixity: 'none',
      arguments: [{ from: 'value', id: 'item', tex: 'v' }],
      rules: [
        {
          rule: { id: 'diff-pair', tex: 'Diff pair' },
          variables: { left: 'l', right: 'r' },
          literals: {},
          patterns: { item: pair(ref('left'), ref('right')) },
          premises: [{ relation: 'prim_neq', args: [ref('left'), ref('right')] }],
        },
      ],
    },
  },
} satisfies System;

function expectSolutions(result: Array<QueryResultSolution> | string): Array<QueryResultSolution> {
  expect(typeof result).not.toBe('string');
  if (typeof result === 'string') {
    throw new TypeError(`Expected query solutions, but execution failed: ${result}`);
  }
  return result;
}

function derivationOf(solution: QueryResultSolution): Derivation {
  if (solution.derivation === undefined) {
    throw new Error('Expected a derivation.');
  }
  return solution.derivation;
}

describe('prim_neq query results', () => {
  it.fails('returns a solution for different ground constructors', () => {
    const solutions = expectSolutions(
      performQuery(fixtureSystem, query('different', [zero, successor])),
    );

    expect(solutions).toHaveLength(1);
  });

  it.fails('returns no solutions for equal ground constructors', () => {
    const solutions = expectSolutions(
      performQuery(fixtureSystem, query('different', [zero, zero])),
    );

    expect(solutions).toEqual([]);
  });

  it.fails('returns a solution for different nested constructors', () => {
    const left = pair(zero, successor);
    const right = pair(successor, zero);

    const solutions = expectSolutions(
      performQuery(fixtureSystem, query('different', [left, right])),
    );

    expect(solutions).toHaveLength(1);
  });

  it.fails('returns no solutions for equal nested constructors', () => {
    const left = pair(zero, successor);
    const right = pair(zero, successor);

    const solutions = expectSolutions(
      performQuery(fixtureSystem, query('different', [left, right])),
    );

    expect(solutions).toEqual([]);
  });
});

describe('prim_neq matched pair results', () => {
  it.fails('returns a solution when a matched pair contains different values', () => {
    const solutions = expectSolutions(
      performQuery(fixtureSystem, query('differentPair', [pair(zero, successor)])),
    );
    const [solution] = solutions;

    expect(solutions).toHaveLength(1);
    expect(solution?.variables).toEqual({});
  });

  it.fails('returns no solutions when a matched pair contains equal values', () => {
    const solutions = expectSolutions(
      performQuery(fixtureSystem, query('differentPair', [pair(zero, zero)])),
    );

    expect(solutions).toEqual([]);
  });

  it.fails('returns a pending solution for two unbound query variables', () => {
    const solutions = expectSolutions(
      performQuery(
        fixtureSystem,
        query('different', [ref('left'), ref('right')], ['left', 'right']),
      ),
    );

    expect(solutions).toHaveLength(1);
    expect(Object.keys(solutions[0]!.variables)).toEqual(['left', 'right']);
  });
});

describe('prim_neq derivation', () => {
  it.fails('records a resolved prim_neq premise', () => {
    const solutions = expectSolutions(
      performQuery(fixtureSystem, query('different', [zero, successor])),
    );
    const [solution] = solutions;

    expect(solution).toBeDefined();
    if (solution === undefined) {
      throw new Error('Expected one solution.');
    }

    const [premise] = derivationOf(solution).premises;

    expect(premise).toBeDefined();
    expect(premise?.relation).toBe('prim_neq');
    expect(premise?.rule).toBe('prim');
    expect(premise?.premises).toEqual([]);
    expect(premise?.args).toEqual([zero, successor]);
  });
});
