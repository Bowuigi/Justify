import { readFile } from 'node:fs/promises';
import { URL } from 'node:url';

import type {
  Derivation,
  DerivationTerm,
  DerivationTermCon,
  Query,
  QueryResultSolution,
  System,
} from '@justify/core';
import { describe, expect, it } from 'vitest';

import { performQuery } from '../lib.ts';

const repositoryRoot = new URL('../../../', import.meta.url);

async function loadExample(
  systemPath: string,
  queryPath: string,
): Promise<{ system: System; query: Query }> {
  const [systemText, queryText] = await Promise.all([
    readFile(new URL(systemPath, repositoryRoot), 'utf8'),
    readFile(new URL(queryPath, repositoryRoot), 'utf8'),
  ]);

  return {
    system: JSON.parse(systemText) as System,
    query: JSON.parse(queryText) as Query,
  };
}

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

function solutionWithRule(
  solutions: Array<QueryResultSolution>,
  rule: string,
): QueryResultSolution {
  const solution = solutions.find(candidate => candidate.derivation?.rule === rule);
  if (solution === undefined) {
    throw new Error(`Expected a solution derived by rule '${rule}'.`);
  }
  return solution;
}

function asConstructor(term: DerivationTerm | undefined): DerivationTermCon {
  if (term?.is !== 'con') {
    throw new TypeError('Expected a constructor term.');
  }
  return term;
}

function naturalNumber(value: number): DerivationTermCon {
  if (value === 0) {
    return { is: 'con', from: 'number', tag: 'zero', args: [] };
  }
  return {
    is: 'con',
    from: 'number',
    tag: 'succ',
    args: [naturalNumber(value - 1)],
  };
}

const unitType: DerivationTermCon = {
  is: 'con',
  from: 'type',
  tag: 'unit',
  args: [],
};

const starTerm: DerivationTermCon = {
  is: 'con',
  from: 'term',
  tag: 'star',
  args: [],
};

describe('canonical natural-number examples', () => {
  it('infers natural-number equality', async () => {
    const { system, query } = await loadExample(
      'examples/nat/system.json',
      'examples/nat/query-equal.json',
    );
    const solutions = expectSolutions(performQuery(system, query));

    expect(solutions).toHaveLength(2);
    const rules = solutions.map(solution => solution.derivation?.rule);
    expect(rules).toContain('base');
    expect(rules).toContain('ind');

    const baseSolution = solutionWithRule(solutions, 'base');
    const inductionSolution = solutionWithRule(solutions, 'ind');
    expect(baseSolution.variables.p).toEqual(naturalNumber(0));
    expect(baseSolution.variables.q).toEqual(naturalNumber(0));
    expect(inductionSolution.variables.p).toEqual(naturalNumber(1));
    expect(inductionSolution.variables.q).toEqual(naturalNumber(1));
    expect(derivationOf(inductionSolution).premises[0]).toMatchObject({
      relation: 'equal',
      rule: 'base',
    });
  });

  it('infers natural-number multiplication', async () => {
    const { system, query } = await loadExample(
      'examples/nat/system.json',
      'examples/nat/query-multiply.json',
    );
    const solutions = expectSolutions(performQuery(system, query));

    expect(solutions).toHaveLength(1);
    const solution = solutions[0]!;
    const derivation = derivationOf(solution);
    expect(solution.variables.r).toEqual(naturalNumber(6));
    expect(derivation.relation).toBe('multiply');
    expect(derivation.rule).toBe('ind');

    const addPremise = derivation.premises.find(premise => premise.relation === 'add');
    expect(addPremise?.rule).toBe('ind');
  });
});

describe('canonical simple type-checking example', () => {
  it('type-checks a simple lambda term', async () => {
    const { system, query } = await loadExample(
      'examples/stlc-unit/system.json',
      'examples/stlc-unit/query-simple.json',
    );
    const solutions = expectSolutions(performQuery(system, query));

    expect(solutions).toHaveLength(1);
    const solution = solutions[0]!;
    const derivation = derivationOf(solution);
    expect(solution.variables).toEqual({});
    expect(derivation.relation).toBe('judge');
    expect(derivation.rule).toBe('lam');

    const variablePremise = derivation.premises.find(premise => premise.rule === 'var');
    expect(variablePremise?.relation).toBe('judge');
    expect(variablePremise?.premises[0]).toMatchObject({
      relation: 'member',
      rule: 'found',
    });
  });
});

describe('canonical application type-checking example', () => {
  it('type-checks an application term', async () => {
    const { system, query } = await loadExample(
      'examples/stlc-unit/system.json',
      'examples/stlc-unit/query-apply.json',
    );
    const solutions = expectSolutions(performQuery(system, query));

    expect(solutions).toHaveLength(1);
    const solution = solutions[0]!;
    const derivation = derivationOf(solution);
    const functionTerm = asConstructor(solution.variables.f);
    expect(solution.variables.x).toEqual(starTerm);
    expect(functionTerm.from).toBe('term');
    expect(functionTerm.tag).toBe('lambda');
    expect(functionTerm.args[2]).toEqual(starTerm);
    expect(derivation.relation).toBe('judge');
    expect(derivation.rule).toBe('app');

    const premiseRules = derivation.premises.map(premise => premise.rule);
    expect(premiseRules).toContain('lam');
    expect(premiseRules).toContain('unit');
  });
});

describe('canonical context-membership example', () => {
  it('finds context members', async () => {
    const { system, query } = await loadExample(
      'examples/stlc-unit/system.json',
      'examples/stlc-unit/query-member.json',
    );
    const solutions = expectSolutions(performQuery(system, query));

    expect(solutions).toHaveLength(2);
    const rules = solutions.map(solution => solution.derivation?.rule);
    expect(rules).toContain('found');
    expect(rules).toContain('next');

    const foundSolution = solutionWithRule(solutions, 'found');
    const nextSolution = solutionWithRule(solutions, 'next');
    expect(foundSolution.variables.ctx).toMatchObject({
      is: 'con',
      from: 'context',
      tag: 'extend',
    });
    expect(derivationOf(nextSolution).premises[0]).toMatchObject({
      relation: 'member',
      rule: 'found',
    });
  });
});

describe('canonical open-ended judging example', () => {
  it('judges open-ended terms', async () => {
    const { system, query } = await loadExample(
      'examples/stlc-unit/system.json',
      'examples/stlc-unit/query-judge.json',
    );
    const solutions = expectSolutions(performQuery(system, query));

    expect(solutions).toHaveLength(5);
    const rules = solutions.map(solution => solution.derivation?.rule);
    expect(rules.filter(rule => rule === 'unit')).toHaveLength(1);
    expect(rules.filter(rule => rule === 'lam')).toHaveLength(3);
    expect(rules.filter(rule => rule === 'app')).toHaveLength(1);

    const unitSolution = solutionWithRule(solutions, 'unit');
    expect(unitSolution.variables.e).toEqual(starTerm);
    expect(unitSolution.variables.t).toEqual(unitType);

    const applicationSolution = solutionWithRule(solutions, 'app');
    const premiseRules = derivationOf(applicationSolution).premises.map(premise => premise.rule);
    expect(premiseRules).toContain('lam');
    expect(premiseRules).toContain('unit');
  });
});
