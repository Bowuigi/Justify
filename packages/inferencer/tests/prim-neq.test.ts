// oxlint-disable max-lines
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

type Relation = System['relations'][string];
type Rule = Relation['rules'][number];
type Premise = Rule['premises'][number];

function makeRelation(
  description: string,
  argumentIds: Array<string>,
  rules: Array<Rule>,
): Relation {
  return {
    description,
    tex_parts: [],
    fixity: 'none',
    arguments: argumentIds.map(id => ({ from: 'value', id, tex: id })),
    rules,
  };
}

function rule(
  id: string,
  variables: Record<string, string>,
  patterns: Record<string, Term>,
  premises: Array<Premise>,
): Rule {
  return {
    rule: { id, tex: id },
    variables,
    literals: {},
    patterns,
    premises,
  };
}

const primNeq: Premise = { relation: 'prim_neq', args: [ref('left'), ref('right')] };

function differentRule(id: string, premises: Array<Premise>): Rule {
  return rule(id, { left: 'l', right: 'r' }, { left: ref('left'), right: ref('right') }, premises);
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
    different: makeRelation(
      'Two different values',
      ['left', 'right'],
      [differentRule('diff', [primNeq])],
    ),
    differentPair: makeRelation(
      'A pair with different values',
      ['item'],
      [
        rule('diff-pair', { left: 'l', right: 'r' }, { item: pair(ref('left'), ref('right')) }, [
          primNeq,
        ]),
      ],
    ),
    zeroValue: makeRelation('A zero value', ['item'], [rule('zero', {}, { item: zero }, [])]),
    successorValue: makeRelation(
      'A successor value',
      ['item'],
      [rule('successor', {}, { item: successor }, [])],
    ),
    differentAfterBindings: makeRelation(
      'Different values after bindings',
      ['left', 'right'],
      [
        differentRule('diff-after-bindings', [
          { relation: 'zeroValue', args: [ref('left')] },
          { relation: 'successorValue', args: [ref('right')] },
          primNeq,
        ]),
      ],
    ),
    differentWithBoundSide: makeRelation(
      'Different values with one bound side',
      ['left', 'right'],
      [differentRule('diff-bound-side', [{ relation: 'zeroValue', args: [ref('left')] }, primNeq])],
    ),
    differentBeforeBindings: makeRelation(
      'Different values before bindings',
      ['left', 'right'],
      [
        differentRule('diff-before-bindings', [
          primNeq,
          { relation: 'zeroValue', args: [ref('left')] },
          { relation: 'successorValue', args: [ref('right')] },
        ]),
      ],
    ),
    differentBeforeEqualBindings: makeRelation(
      'Equal values before bindings',
      ['left', 'right'],
      [
        differentRule('diff-before-equal-bindings', [
          primNeq,
          { relation: 'zeroValue', args: [ref('left')] },
          { relation: 'zeroValue', args: [ref('right')] },
        ]),
      ],
    ),
  },
} satisfies System;

function expectSolutions(result: Array<QueryResultSolution> | string): Array<QueryResultSolution> {
  expect(typeof result).not.toBe('string');
  if (typeof result === 'string') {
    throw new TypeError(`Expected query solutions, but execution failed: ${result}`);
  }
  return result;
}

function expectOneSolution(system: System, querySpec: Query): QueryResultSolution {
  const solutions = expectSolutions(performQuery(system, querySpec));
  expect(solutions).toHaveLength(1);
  return solutions[0]!;
}

function derivationOf(solution: QueryResultSolution): Derivation {
  if (solution.derivation === undefined) {
    throw new Error('Expected a derivation.');
  }
  return solution.derivation;
}

describe('prim_neq query results', () => {
  it('returns a solution for different ground constructors', () => {
    const solution = expectOneSolution(fixtureSystem, query('different', [zero, successor]));

    expect(solution).toBeDefined();
  });

  it('returns no solutions for equal ground constructors', () => {
    const solutions = expectSolutions(
      performQuery(fixtureSystem, query('different', [zero, zero])),
    );

    expect(solutions).toEqual([]);
  });

  it('returns a solution for different nested constructors', () => {
    const left = pair(zero, successor);
    const right = pair(successor, zero);

    const solution = expectOneSolution(fixtureSystem, query('different', [left, right]));

    expect(solution).toBeDefined();
  });

  it('returns no solutions for equal nested constructors', () => {
    const left = pair(zero, successor);
    const right = pair(zero, successor);

    const solutions = expectSolutions(
      performQuery(fixtureSystem, query('different', [left, right])),
    );

    expect(solutions).toEqual([]);
  });
});

describe('prim_neq matched pair results', () => {
  it('returns a solution when a matched pair contains different values', () => {
    const solution = expectOneSolution(
      fixtureSystem,
      query('differentPair', [pair(zero, successor)]),
    );

    expect(solution.variables).toEqual({});
  });

  it('returns no solutions when a matched pair contains equal values', () => {
    const solutions = expectSolutions(
      performQuery(fixtureSystem, query('differentPair', [pair(zero, zero)])),
    );

    expect(solutions).toEqual([]);
  });

  it('returns a pending solution for two unbound query variables', () => {
    const solution = expectOneSolution(
      fixtureSystem,
      query('different', [ref('left'), ref('right')], ['left', 'right']),
    );

    expect(Object.keys(solution.variables)).toEqual(['left', 'right']);
  });
});

describe('prim_neq derivation', () => {
  it('records a resolved prim_neq premise', () => {
    const solution = expectOneSolution(fixtureSystem, query('different', [zero, successor]));
    const [premise] = derivationOf(solution).premises;

    expect(premise).toBeDefined();
    expect(premise?.relation).toBe('prim_neq');
    expect(premise?.rule).toBe('prim');
    expect(premise?.premises).toEqual([]);
    expect(premise?.args).toEqual([zero, successor]);
  });
});

describe('surfaced pending prim_neq constraints', () => {
  it('surfaces a pending constraint for two unbound query variables', () => {
    const solution = expectOneSolution(
      fixtureSystem,
      query('different', [ref('left'), ref('right')], ['left', 'right']),
    );

    expect(solution.constraints).toMatchInlineSnapshot(`
      {
        "neq": [
          {
            "a": {
              "counter": 2,
              "id": "left",
              "is": "var",
            },
            "b": {
              "counter": 3,
              "id": "right",
              "is": "var",
            },
          },
        ],
      }
    `);
  });
});

describe('surfaced absent prim_neq constraints', () => {
  it('returns no constraints for different ground constructors', () => {
    const solution = expectOneSolution(fixtureSystem, query('different', [zero, successor]));

    expect(solution.constraints).toEqual({ neq: [] });
  });

  it('returns no constraints when earlier bindings make the terms different', () => {
    const solution = expectOneSolution(
      fixtureSystem,
      query('differentAfterBindings', [ref('left'), ref('right')], ['left', 'right']),
    );

    expect(solution.constraints).toEqual({ neq: [] });
  });
});

describe('surfaced resolved prim_neq constraints', () => {
  it('keeps a constraint with one bound side and one unbound side', () => {
    const solution = expectOneSolution(
      fixtureSystem,
      query('differentWithBoundSide', [ref('left'), ref('right')], ['left', 'right']),
    );

    expect(solution.constraints.neq).toEqual([
      {
        a: zero,
        b: { is: 'var', id: 'right', counter: 3 },
      },
    ]);
  });

  it('removes a constraint when later bindings make the terms different', () => {
    const solution = expectOneSolution(
      fixtureSystem,
      query('differentBeforeBindings', [ref('left'), ref('right')], ['left', 'right']),
    );

    expect(solution.constraints).toEqual({ neq: [] });
  });

  it('rejects a constraint when later bindings make the terms equal', () => {
    const solutions = expectSolutions(
      performQuery(
        fixtureSystem,
        query('differentBeforeEqualBindings', [ref('left'), ref('right')], ['left', 'right']),
      ),
    );

    expect(solutions).toEqual([]);
  });
});

describe('top-level prim_neq query', () => {
  it('returns no solutions for equal ground constructors', () => {
    const solutions = expectSolutions(performQuery(fixtureSystem, query('prim_neq', [zero, zero])));

    expect(solutions).toEqual([]);
  });

  it('returns a solution without constraints for different ground constructors', () => {
    const solution = expectOneSolution(fixtureSystem, query('prim_neq', [zero, successor]));

    expect(solution.constraints).toEqual({ neq: [] });
  });

  it('returns a solution with one constraint for two unbound variables', () => {
    const solution = expectOneSolution(
      fixtureSystem,
      query('prim_neq', [ref('left'), ref('right')], ['left', 'right']),
    );

    expect(solution.constraints.neq).toHaveLength(1);
  });
});
