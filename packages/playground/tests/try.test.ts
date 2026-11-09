import type { DerivationTerm, Query, QueryResultSolution, System } from '@justify/core';
import type * as Inferencer from '@justify/inferencer';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { tryQuery } from '../lib/try.ts';

const performed = vi.hoisted(() => ({ performQuery: vi.fn() }));

vi.mock('@justify/inferencer', async importOriginal => {
  const actual = await importOriginal<typeof Inferencer>();
  return {
    ...actual,
    performQuery: performed.performQuery,
  };
});

const system: System = {
  description: 'Test System',
  syntax: {
    number: {
      description: 'Natural number',
      suggestions: [],
      grammar: [
        { id: 'zero', description: 'Zero', tex_parts: ['0'], fixity: 'none', arguments: [] },
        {
          id: 'succ',
          description: 'Successor',
          tex_parts: ['S'],
          fixity: 'prefix',
          arguments: [{ from: 'number', id: 'n', tex: 'n' }],
        },
      ],
    },
  },
  relations: {
    add: {
      description: 'Add',
      tex_parts: ['+'],
      fixity: 'none',
      arguments: [
        { from: 'number', id: 'n', tex: 'n' },
        { from: 'number', id: 'm', tex: 'm' },
        { from: 'number', id: 'k', tex: 'k' },
      ],
      rules: [],
    },
  },
};

const validQuery: Query = {
  variables: { p: 'p', q: 'q', k: 'k' },
  literals: {},
  max_results: 1,
  relation: 'add',
  args: [
    { is: 'ref', to: 'p' },
    { is: 'ref', to: 'q' },
    { is: 'ref', to: 'k' },
  ],
};

const validQueryText = JSON.stringify(validQuery);

const zeroTerm: DerivationTerm = { is: 'con', from: 'number', tag: 'zero', args: [] };
const emptyConstraints: QueryResultSolution['constraints'] = { neq: [] };

function solutionWith(
  term: DerivationTerm,
  constraints: QueryResultSolution['constraints'] = emptyConstraints,
): QueryResultSolution {
  return { variables: { p: term }, constraints };
}

function throwNonError(): never {
  const value: unknown = 'string error';
  throw value;
}

describe('tryQuery empty and invalid', () => {
  beforeEach(() => {
    performed.performQuery.mockReset();
  });

  it('returns empty for a blank query without calling the inferencer', () => {
    const outcome = tryQuery('', system);
    expect(outcome.status).toBe('empty');
    expect(performed.performQuery).not.toHaveBeenCalled();
  });

  it('returns invalid for malformed JSON without calling the inferencer', () => {
    const outcome = tryQuery('{ not json', system);
    expect(outcome.status).toBe('invalid');
    if (outcome.status !== 'invalid') return;
    expect(outcome.diagnostics.length).toBeGreaterThan(0);
    expect(performed.performQuery).not.toHaveBeenCalled();
  });

  it('returns invalid for a semantically invalid query without calling the inferencer', () => {
    const bad = { ...validQuery, relation: 'no_such_relation' };
    const outcome = tryQuery(JSON.stringify(bad), system);
    expect(outcome.status).toBe('invalid');
    if (outcome.status !== 'invalid') return;
    expect(outcome.diagnostics.length).toBeGreaterThan(0);
    expect(performed.performQuery).not.toHaveBeenCalled();
  });
});

describe('tryQuery performs', () => {
  beforeEach(() => {
    performed.performQuery.mockReset();
  });

  it('calls performQuery with the parsed query and system', () => {
    performed.performQuery.mockReturnValue([]);
    tryQuery(validQueryText, system);
    expect(performed.performQuery).toHaveBeenCalledTimes(1);
    expect(performed.performQuery).toHaveBeenCalledWith(system, validQuery);
  });

  it('returns success with solutions converted to bindings and derivation TeX', () => {
    performed.performQuery.mockReturnValue([solutionWith(zeroTerm)]);
    const outcome = tryQuery(validQueryText, system);
    expect(outcome.status).toBe('success');
    if (outcome.status !== 'success') return;
    expect(outcome.solutions).toHaveLength(1);
    expect(outcome.solutions[0]!.bindings).toEqual([
      { id: 'p', texId: 'p', texValue: String.raw`\jgNumberZero{}` },
    ]);
    expect(outcome.solutions[0]!.derivationTeX).toBeNull();
    expect(outcome.solutions[0]!.constraints).toEqual([]);
    expect(outcome.solutions[0]!.unboundVariables).toEqual([]);
  });

  it('keeps solutions in inferencer order', () => {
    performed.performQuery.mockReturnValue([
      solutionWith(zeroTerm),
      solutionWith(zeroTerm),
      solutionWith(zeroTerm),
    ]);
    const outcome = tryQuery(validQueryText, system);
    expect(outcome.status).toBe('success');
    if (outcome.status !== 'success') return;
    expect(outcome.solutions).toHaveLength(3);
  });
});

describe('tryQuery constraints', () => {
  beforeEach(() => {
    performed.performQuery.mockReset();
  });

  it('converts pending disequality constraints to TeX', () => {
    const left: DerivationTerm = { is: 'var', id: 'p', counter: 0 };
    const right: DerivationTerm = { is: 'var', id: 'q', counter: 0 };
    performed.performQuery.mockReturnValue([
      solutionWith(zeroTerm, { neq: [{ a: left, b: right }] }),
    ]);

    const outcome = tryQuery(validQueryText, system);
    expect(outcome.status).toBe('success');
    if (outcome.status !== 'success') return;
    expect(outcome.solutions[0]!.constraints).toEqual([
      { left: String.raw`p^{0}`, right: String.raw`q^{0}` },
    ]);
  });

  it('reports query variables that remain unbound in pending constraints', () => {
    const unbound: DerivationTerm = { is: 'var', id: 'p', counter: 0 };
    const nested: DerivationTerm = {
      is: 'con',
      from: 'number',
      tag: 'succ',
      args: [unbound],
    };
    performed.performQuery.mockReturnValue([
      { variables: {}, constraints: { neq: [{ a: zeroTerm, b: nested }] } },
    ]);

    const outcome = tryQuery(validQueryText, system);
    expect(outcome.status).toBe('success');
    if (outcome.status !== 'success') return;
    expect(outcome.solutions[0]!.unboundVariables).toEqual([{ id: 'p', texId: 'p' }]);
  });
});

describe('tryQuery fatal', () => {
  beforeEach(() => {
    performed.performQuery.mockReset();
  });

  it('returns fatal when performQuery returns a fatal string', () => {
    performed.performQuery.mockReturnValue('Fatal error on execution (Error): boom');
    const outcome = tryQuery(validQueryText, system);
    expect(outcome.status).toBe('fatal');
    if (outcome.status !== 'fatal') return;
    expect(outcome.message).toContain('boom');
  });

  it('returns fatal when performQuery throws an Error', () => {
    performed.performQuery.mockImplementation(() => {
      throw new Error('kaboom');
    });
    const outcome = tryQuery(validQueryText, system);
    expect(outcome.status).toBe('fatal');
    if (outcome.status !== 'fatal') return;
    expect(outcome.message).toBe('kaboom');
  });

  it('returns fatal when performQuery throws a non-error value', () => {
    performed.performQuery.mockImplementation(throwNonError);
    const outcome = tryQuery(validQueryText, system);
    expect(outcome.status).toBe('fatal');
    if (outcome.status !== 'fatal') return;
    expect(outcome.message).toBe('string error');
  });
});
