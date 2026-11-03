import type { Derivation, Query, QueryResultSolution, System, Term, TermCon } from '@justify/core';
import { describe, expect, it } from 'vitest';

import { performQuery } from '../lib.ts';

function ref(to: string): Term {
  return { is: 'ref', to };
}

function con(from: string, tag: string, args: Array<Term>): TermCon {
  return { is: 'con', from, tag, args };
}

const zeroValue = con('value', 'zero', []);
const successorValue = con('value', 'succ', [zeroValue]);

const fixtureSystem: System = {
  description: 'A minimal system for public query tests',
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
    value: {
      description: 'A value is a zero or a successor',
      tex_parts: [],
      fixity: 'none',
      arguments: [{ from: 'value', id: 'item', tex: 'v' }],
      rules: [
        {
          rule: { id: 'zero', tex: 'Zero' },
          variables: {},
          literals: {},
          patterns: { item: zeroValue },
          premises: [],
        },
        {
          rule: { id: 'succ', tex: 'Succ' },
          variables: { value: 'v' },
          literals: {},
          patterns: {
            item: con('value', 'succ', [ref('value')]),
          },
          premises: [{ relation: 'value', args: [ref('value')] }],
        },
      ],
    },
    pair: {
      description: 'A pair of values',
      tex_parts: [],
      fixity: 'none',
      arguments: [{ from: 'value', id: 'item', tex: 'v' }],
      rules: [
        {
          rule: { id: 'pair', tex: 'Pair' },
          variables: { left: 'l', right: 'r' },
          literals: {},
          patterns: {
            item: con('value', 'pair', [ref('left'), ref('right')]),
          },
          premises: [
            { relation: 'value', args: [ref('left')] },
            { relation: 'value', args: [ref('right')] },
          ],
        },
      ],
    },
    label: {
      description: 'A supported label',
      tex_parts: [],
      fixity: 'none',
      arguments: [{ from: 'literal', id: 'name', tex: 'l' }],
      rules: [
        {
          rule: { id: 'yes', tex: 'Yes' },
          variables: {},
          literals: { yes: 'yes' },
          patterns: { name: ref('yes') },
          premises: [],
        },
        {
          rule: { id: 'no', tex: 'No' },
          variables: {},
          literals: { no: 'no' },
          patterns: { name: ref('no') },
          premises: [],
        },
      ],
    },
  },
};

const pairQuery = {
  relation: 'pair',
  max_results: 1,
  variables: { item: 'v' },
  literals: {},
  args: [ref('item')],
} satisfies Query;

const zeroQuery = {
  relation: 'value',
  max_results: 1,
  variables: {},
  literals: {},
  args: [zeroValue],
} satisfies Query;

const successorQuery = {
  relation: 'value',
  max_results: 1,
  variables: {},
  literals: {},
  args: [successorValue],
} satisfies Query;

const limitedValueQuery = {
  relation: 'value',
  max_results: 2,
  variables: { value: 'v' },
  literals: {},
  args: [ref('value')],
} satisfies Query;

const zeroLimitQuery = {
  relation: 'value',
  max_results: 0,
  variables: { value: 'v' },
  literals: {},
  args: [ref('value')],
} satisfies Query;

const literalQuery = {
  relation: 'label',
  max_results: 1,
  variables: { name: 'l' },
  literals: {},
  args: [ref('name')],
} satisfies Query;

const unsupportedLiteralQuery = {
  relation: 'label',
  max_results: 1,
  variables: {},
  literals: { unknown: 'unknown' },
  args: [ref('unknown')],
} satisfies Query;

const unboundReferenceQuery = {
  relation: 'value',
  max_results: 1,
  variables: {},
  literals: {},
  args: [ref('missing')],
} satisfies Query;

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

describe('performQuery result boundary', () => {
  it('binds query variables to constructor terms', () => {
    const solutions = expectSolutions(performQuery(fixtureSystem, pairQuery));

    expect(solutions).toHaveLength(1);
    expect(solutions[0]?.variables).toEqual({
      item: {
        is: 'con',
        from: 'value',
        tag: 'pair',
        args: [
          { is: 'con', from: 'value', tag: 'zero', args: [] },
          { is: 'con', from: 'value', tag: 'zero', args: [] },
        ],
      },
    });
  });

  it('can return a literal binding', () => {
    const solutions = expectSolutions(performQuery(fixtureSystem, literalQuery));

    expect(solutions).toHaveLength(1);
    expect(solutions[0]?.variables).toEqual({
      name: { is: 'lit', id: 'yes' },
    });
    expect(derivationOf(solutions[0]!).rule).toBe('yes');
  });

  it('does not expose internal rule variables', () => {
    const solutions = expectSolutions(performQuery(fixtureSystem, pairQuery));
    const pairSolution = solutions[0]!;

    expect(Object.keys(pairSolution.variables)).toEqual(['item']);
    expect(pairSolution.variables).not.toHaveProperty('left');
    expect(pairSolution.variables).not.toHaveProperty('right');
  });

  it('returns no solutions when no rule matches', () => {
    const solutions = expectSolutions(performQuery(fixtureSystem, unsupportedLiteralQuery));

    expect(solutions).toEqual([]);
  });

  it('returns no solutions when the result limit is zero', () => {
    const solutions = expectSolutions(performQuery(fixtureSystem, zeroLimitQuery));

    expect(solutions).toEqual([]);
  });
});

describe('performQuery rule compilation', () => {
  it('supports multiple rules', () => {
    const zeroSolutions = expectSolutions(performQuery(fixtureSystem, zeroQuery));
    const successorSolutions = expectSolutions(performQuery(fixtureSystem, successorQuery));

    expect(zeroSolutions[0]?.derivation?.rule).toBe('zero');
    expect(successorSolutions[0]?.derivation?.rule).toBe('succ');
  });

  it('supports recursive relations', () => {
    const solutions = expectSolutions(performQuery(fixtureSystem, successorQuery));
    const derivation = derivationOf(solutions[0]!);

    expect(derivation.relation).toBe('value');
    expect(derivation.premises[0]?.relation).toBe('value');
    expect(derivation.premises[0]?.rule).toBe('zero');
  });

  it('supports multiple premises', () => {
    const solutions = expectSolutions(performQuery(fixtureSystem, pairQuery));
    const derivation = derivationOf(solutions[0]!);

    expect(derivation.rule).toBe('pair');
    expect(derivation.premises).toHaveLength(2);
    expect(derivation.premises.map(premise => premise.relation)).toEqual(['value', 'value']);
  });

  it('stops after the requested number of results', () => {
    const solutions = expectSolutions(performQuery(fixtureSystem, limitedValueQuery));

    expect(solutions).toHaveLength(2);
  });
});

describe('performQuery fatal errors', () => {
  it('reports an unbound query reference', () => {
    const result = performQuery(fixtureSystem, unboundReferenceQuery);

    expect(typeof result).toBe('string');
    if (typeof result !== 'string') {
      throw new TypeError('Expected a fatal error string.');
    }
    expect(result).toContain('(UnboundIdentifierError)');
    expect(result).toContain("Unbound identifier 'missing'");
    expect(result).toContain('not a bound variable or literal');
  });
});
