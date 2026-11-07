import type {
  DerivationTermCon,
  Query,
  QueryResult,
  QueryResultSolutionConstraintsNeq,
  System,
  SystemRelation,
  SystemRelationRulePremise,
  Term,
  TermCon,
} from '@justify/core';
import { describe, expect, it } from 'vitest';

import { validateQuery, validateQueryResult, validateSystem } from '../lib.ts';

const FILENAME = '<test>';

function ref(to: string): Term {
  return { is: 'ref', to };
}

function con(from: string, tag: string, args: Array<Term>): TermCon {
  return { is: 'con', from, tag, args };
}

const zero = con('value', 'zero', []);
const derivationZero: DerivationTermCon = { is: 'con', from: 'value', tag: 'zero', args: [] };

function neqPremise(args: Array<Term>): SystemRelationRulePremise {
  return { relation: 'prim_neq', args };
}

const validNeqPremise = neqPremise([ref('left'), ref('right')]);

function differentRelation(premises: Array<SystemRelationRulePremise>): SystemRelation {
  return {
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
        premises,
      },
    ],
  };
}

function makeSystem(premises: Array<SystemRelationRulePremise>): System {
  return {
    description: 'A minimal system for prim_neq validation tests',
    syntax: {
      value: {
        description: 'Values',
        suggestions: ['v'],
        grammar: [
          { id: 'zero', description: 'Zero', tex_parts: ['0'], fixity: 'none', arguments: [] },
          {
            id: 'succ',
            description: 'Successor',
            tex_parts: ['S'],
            fixity: 'prefix',
            arguments: [{ from: 'value', id: 'value', tex: 'v' }],
          },
        ],
      },
    },
    relations: { different: differentRelation(premises) },
  };
}

const system = makeSystem([validNeqPremise]);

function makeQuery(relation: string, args: Array<Term>): Query {
  return {
    relation,
    args,
    max_results: 1,
    variables: { left: 'l', right: 'r' },
    literals: {},
  };
}

function makeQueryResult(constraint: QueryResultSolutionConstraintsNeq): QueryResult {
  return {
    count: 1,
    solutions: [{ variables: {}, constraints: { neq: [constraint] } }],
  };
}

function diagnosticCodes(diagnostics: Array<{ code?: string }>): Array<string | undefined> {
  return diagnostics.map(diagnostic => diagnostic.code);
}

describe('prim_neq premises', () => {
  it('validates a valid System', () => {
    expect(validateSystem(system, FILENAME)).toEqual([]);
  });

  it('rejects a premise with too few arguments', () => {
    const invalid = makeSystem([neqPremise([ref('left')])]);

    expect(diagnosticCodes(validateSystem(invalid, FILENAME))).toContain('CAC-M');
  });

  it('rejects a premise with too many arguments', () => {
    const invalid = makeSystem([neqPremise([ref('left'), ref('right'), zero])]);

    expect(diagnosticCodes(validateSystem(invalid, FILENAME))).toContain('CAC-E');
  });

  it('still rejects an undefined relation in a premise', () => {
    const invalid = makeSystem([{ relation: 'missing', args: [ref('left'), ref('right')] }]);

    expect(diagnosticCodes(validateSystem(invalid, FILENAME))).toContain('ODR-P');
  });
});

describe('prim_neq queries', () => {
  it('accepts a query with two terms', () => {
    expect(
      validateQuery(makeQuery('prim_neq', [ref('left'), ref('right')]), system, FILENAME),
    ).toEqual([]);
  });

  it('rejects a query with too few arguments', () => {
    const query = makeQuery('prim_neq', [ref('left')]);

    expect(diagnosticCodes(validateQuery(query, system, FILENAME))).toContain('CAC-M');
  });

  it('rejects a query with too many arguments', () => {
    const query = makeQuery('prim_neq', [ref('left'), ref('right'), zero]);

    expect(diagnosticCodes(validateQuery(query, system, FILENAME))).toContain('CAC-E');
  });

  it('still rejects an undefined relation in a query', () => {
    const query = makeQuery('missing', [ref('left'), ref('right')]);

    expect(diagnosticCodes(validateQuery(query, system, FILENAME))).toContain('ODR-Q');
  });
});

describe('reserved prim_neq relation name', () => {
  it('rejects a System relation named prim_neq', () => {
    const reserved = makeSystem([]);
    reserved.relations.prim_neq = differentRelation([]);

    expect(diagnosticCodes(validateSystem(reserved, FILENAME))).toContain('ODR-R');
  });
});

describe('prim_neq constraints in QueryResults', () => {
  it('accepts valid constraint terms', () => {
    const queryResult = makeQueryResult({
      a: derivationZero,
      b: { is: 'var', id: 'right', counter: 0 },
    });

    expect(validateQueryResult(queryResult, system, FILENAME)).toEqual([]);
  });

  it('rejects an invalid constraint identifier', () => {
    const queryResult = makeQueryResult({
      a: { is: 'lit', id: 'Not Valid' },
      b: derivationZero,
    });

    expect(diagnosticCodes(validateQueryResult(queryResult, system, FILENAME))).toContain('VI-I');
  });
});
