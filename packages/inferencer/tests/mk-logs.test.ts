import { describe, expect, it } from 'vitest';

import { AssocArray } from '../assoc-array.ts';
import { conjN, eq, run, toIdempotent, walkLog, wrapLogs, type RuleLog, type Term } from '../mk.ts';
import { constructorTerm, literal, variable, type VariableTerm } from './helpers.ts';

function substitution(entries: Array<[VariableTerm, Term]>): AssocArray<VariableTerm, Term> {
  return new AssocArray(entries.map(([key, value]) => ({ key, value })));
}

type Solution = ReturnType<typeof run>[number];

function onlySolution(solutions: Array<Solution>): Solution {
  const [solution] = solutions;
  if (solution === undefined) {
    throw new Error('Expected one solution.');
  }
  return solution;
}

describe('wrapLogs metadata', () => {
  it('records nested rules and keeps premise arguments and order', () => {
    const x = variable('x', 0);
    const y = variable('y', 1);
    const z = variable('z', 2);
    const first = wrapLogs('first-rule', 'first-relation', [x], eq(x, literal('first-value')));
    const second = wrapLogs('second-rule', 'second-relation', [y], eq(y, literal('second-value')));
    const outer = wrapLogs(
      'outer-rule',
      'outer-relation',
      [z],
      conjN(eq(z, literal('outer-value')), first, second),
    );

    const solution = onlySolution(run(1, outer));

    expect(solution.log).toEqual([
      {
        rule: 'outer-rule',
        relation: 'outer-relation',
        args: [z],
        premises: [
          {
            rule: 'first-rule',
            relation: 'first-relation',
            args: [x],
            premises: [],
          },
          {
            rule: 'second-rule',
            relation: 'second-relation',
            args: [y],
            premises: [],
          },
        ],
      },
    ]);
  });
});

describe('wrapLogs arguments', () => {
  it('resolves stored arguments against the final substitution', () => {
    const x = variable('x', 0);
    const wrapped = wrapLogs('rule', 'relation', [x], eq(x, literal('resolved-value')));

    const solution = onlySolution(run(1, wrapped));
    const [log] = solution.log;
    if (log === undefined) {
      throw new Error('Expected one rule log.');
    }

    const resolved = walkLog(log, solution.subst);

    expect(resolved.args).toEqual([literal('resolved-value')]);
  });
});

describe('wrapLogs isolation', () => {
  it('isolates child premises without duplicating parent logs', () => {
    const parent = wrapLogs(
      'parent-rule',
      'parent-relation',
      [],
      eq(literal('parent'), literal('parent')),
    );
    const nested = wrapLogs(
      'nested-rule',
      'nested-relation',
      [],
      eq(literal('nested'), literal('nested')),
    );
    const child = wrapLogs('child-rule', 'child-relation', [], nested);

    const solution = onlySolution(run(1, conjN(parent, child)));

    expect(solution.log).toEqual([
      {
        rule: 'parent-rule',
        relation: 'parent-relation',
        args: [],
        premises: [],
      },
      {
        rule: 'child-rule',
        relation: 'child-relation',
        args: [],
        premises: [
          {
            rule: 'nested-rule',
            relation: 'nested-relation',
            args: [],
            premises: [],
          },
        ],
      },
    ]);
    expect(solution.log.filter(log => log.rule === 'parent-rule')).toHaveLength(1);
  });
});

describe('walkLog', () => {
  it('resolves constructors, literals, variables, and nested premises', () => {
    const x = variable('x', 0);
    const y = variable('y', 1);
    const z = variable('z', 2);
    const log: RuleLog = {
      rule: 'root-rule',
      relation: 'root-relation',
      args: [
        literal('literal-value'),
        x,
        constructorTerm('term', 'pair', [y, literal('nested-literal')]),
      ],
      premises: [
        {
          rule: 'premise-rule',
          relation: 'premise-relation',
          args: [z, constructorTerm('term', 'unit', [])],
          premises: [],
        },
      ],
    };
    const subst = substitution([
      [x, literal('x-value')],
      [y, constructorTerm('term', 'unit', [])],
      [z, literal('z-value')],
    ]);

    expect(walkLog(log, subst)).toEqual({
      rule: 'root-rule',
      relation: 'root-relation',
      args: [
        literal('literal-value'),
        literal('x-value'),
        constructorTerm('term', 'pair', [
          constructorTerm('term', 'unit', []),
          literal('nested-literal'),
        ]),
      ],
      premises: [
        {
          rule: 'premise-rule',
          relation: 'premise-relation',
          args: [literal('z-value'), constructorTerm('term', 'unit', [])],
          premises: [],
        },
      ],
    });
  });
});

describe('toIdempotent direct bindings', () => {
  it('resolves a direct binding', () => {
    const x = variable('x', 0);
    const subst = substitution([[x, literal('value')]]);

    expect(toIdempotent(subst).data).toEqual([{ key: x, value: literal('value') }]);
  });

  it('resolves a binding nested in a constructor', () => {
    const x = variable('x', 0);
    const y = variable('y', 1);
    const subst = substitution([
      [x, constructorTerm('term', 'pair', [y])],
      [y, literal('nested-value')],
    ]);

    expect(toIdempotent(subst).data).toEqual([
      { key: x, value: constructorTerm('term', 'pair', [literal('nested-value')]) },
      { key: y, value: literal('nested-value') },
    ]);
  });
});

describe('toIdempotent chained bindings', () => {
  it('resolves a chain of bindings', () => {
    const x = variable('x', 0);
    const y = variable('y', 1);
    const z = variable('z', 2);
    const subst = substitution([
      [x, y],
      [y, z],
      [z, literal('chained-value')],
    ]);

    expect(toIdempotent(subst).data).toEqual([
      { key: x, value: literal('chained-value') },
      { key: y, value: literal('chained-value') },
      { key: z, value: literal('chained-value') },
    ]);
  });

  it('does not change the result when applied again', () => {
    const x = variable('x', 0);
    const y = variable('y', 1);
    const subst = substitution([
      [x, y],
      [y, literal('value')],
    ]);
    const once = toIdempotent(subst);
    const twice = toIdempotent(once);

    expect(twice.data).toEqual(once.data);
  });
});
