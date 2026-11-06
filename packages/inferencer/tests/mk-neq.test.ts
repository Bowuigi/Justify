import { describe, expect, it } from 'vitest';

import { conjN, eq, neq, run } from '../mk.ts';
import { con, lit, var_ } from './helpers.ts';

type Solution = ReturnType<typeof run>[number];

function expectUnchangedState(solution: Solution): void {
  expect(solution.subst.data).toEqual([]);
  expect(solution.log).toEqual([]);
  expect(solution.counter).toBe(0);
}

describe('neq with trivially different terms', () => {
  it('succeeds for different literals', () => {
    const solutions = run(1, neq(lit('a'), lit('b')));

    expect(solutions).toHaveLength(1);
    expectUnchangedState(solutions[0]!);
  });

  it('succeeds for a literal and a constructor', () => {
    const constr = con('term', 'pair', []);

    const solutions = run(1, neq(lit('a'), constr));

    expect(solutions).toHaveLength(1);
    expectUnchangedState(solutions[0]!);
  });

  it('succeeds for constructors with different tags', () => {
    const left = con('term', 'left', []);
    const right = con('term', 'right', []);

    const solutions = run(1, neq(left, right));

    expect(solutions).toHaveLength(1);
    expectUnchangedState(solutions[0]!);
  });

  it('succeeds for constructors with equal tags and different sources', () => {
    const left = con('term', 'pair', []);
    const right = con('other', 'pair', []);

    const solutions = run(1, neq(left, right));

    expect(solutions).toHaveLength(1);
    expectUnchangedState(solutions[0]!);
  });

  it('succeeds for an occurs-check pair', () => {
    const x = var_('x', 0);
    const recursive = con('term', 'pair', [x]);

    const solutions = run(1, neq(x, recursive));

    expect(solutions).toHaveLength(1);
    expectUnchangedState(solutions[0]!);
  });
});

describe('neq with trivially equal terms', () => {
  it('fails for identical variables', () => {
    const x = var_('x', 0);

    const solutions = run(1, neq(x, x));

    expect(solutions).toHaveLength(0);
  });

  it('fails for equal literals', () => {
    const solutions = run(1, neq(lit('a'), lit('a')));

    expect(solutions).toHaveLength(0);
  });
});

describe('neq with bound equal terms', () => {
  it('fails for a variable bound to an equal literal', () => {
    const x = var_('x', 0);

    const solutions = run(1, conjN(eq(x, lit('a')), neq(x, lit('a'))));

    expect(solutions).toHaveLength(0);
  });

  it('fails for a variable bound through a chain to an equal literal', () => {
    const x = var_('x', 0);
    const y = var_('y', 1);

    const solutions = run(1, conjN(eq(x, y), eq(y, lit('a')), neq(x, lit('a'))));

    expect(solutions).toHaveLength(0);
  });
});

describe('neq with equal constructors', () => {
  it('fails for equal constructors', () => {
    const left = con('term', 'pair', []);
    const right = con('term', 'pair', []);

    const solutions = run(1, neq(left, right));

    expect(solutions).toHaveLength(0);
  });

  it('fails for nested constructors that become equal after bindings', () => {
    const x = var_('x', 0);
    const y = var_('y', 1);
    const left = con('term', 'pair', [x]);
    const right = con('term', 'pair', [y]);

    const solutions = run(1, conjN(eq(x, lit('a')), eq(y, lit('a')), neq(left, right)));

    expect(solutions).toHaveLength(0);
  });
});

describe('neq with deferred constraints', () => {
  it('succeeds for a variable and a literal', () => {
    const x = var_('x', 0);

    const solutions = run(1, neq(x, lit('a')));

    expect(solutions).toHaveLength(1);
    expectUnchangedState(solutions[0]!);
  });

  it('succeeds for two variables', () => {
    const x = var_('x', 0);
    const y = var_('y', 1);

    const solutions = run(1, neq(x, y));

    expect(solutions).toHaveLength(1);
    expectUnchangedState(solutions[0]!);
  });

  it('succeeds for a variable inside a constructor', () => {
    const x = var_('x', 0);
    const constr = con('term', 'pair', [lit('a')]);

    const solutions = run(1, neq(x, constr));

    expect(solutions).toHaveLength(1);
    expectUnchangedState(solutions[0]!);
  });

  it('succeeds for variables inside both constructors', () => {
    const x = var_('x', 0);
    const y = var_('y', 1);
    const left = con('term', 'pair', [x]);
    const right = con('term', 'pair', [y]);

    const solutions = run(1, neq(left, right));

    expect(solutions).toHaveLength(1);
    expectUnchangedState(solutions[0]!);
  });
});

describe('neq constraint resolution', () => {
  it('rejects a later binding that makes a variable equal to a literal', () => {
    const x = var_('x', 0);

    const solutions = run(1, conjN(neq(x, lit('a')), eq(x, lit('a'))));

    expect(solutions).toHaveLength(0);
  });

  it('rejects an earlier binding that makes a variable equal to a literal', () => {
    const x = var_('x', 0);

    const solutions = run(1, conjN(eq(x, lit('a')), neq(x, lit('a'))));

    expect(solutions).toHaveLength(0);
  });

  it('accepts a later binding that makes a variable different from a literal', () => {
    const x = var_('x', 0);

    const solutions = run(1, conjN(neq(x, lit('a')), eq(x, lit('b'))));

    expect(solutions).toHaveLength(1);
    expect(solutions[0]?.subst.data).toEqual([{ key: x, value: lit('b') }]);
    expect(solutions[0]?.log).toEqual([]);
    expect(solutions[0]?.counter).toBe(0);
  });

  it('accepts an earlier binding that makes a variable different from a literal', () => {
    const x = var_('x', 0);

    const solutions = run(1, conjN(eq(x, lit('b')), neq(x, lit('a'))));

    expect(solutions).toHaveLength(1);
    expect(solutions[0]?.subst.data).toEqual([{ key: x, value: lit('b') }]);
    expect(solutions[0]?.log).toEqual([]);
    expect(solutions[0]?.counter).toBe(0);
  });
});

describe('neq constraint resolution for variables', () => {
  it('rejects a later binding that makes two variables equal', () => {
    const x = var_('x', 0);
    const y = var_('y', 1);

    const solutions = run(1, conjN(neq(x, y), eq(x, y)));

    expect(solutions).toHaveLength(0);
  });

  it('rejects an earlier binding that makes two variables equal', () => {
    const x = var_('x', 0);
    const y = var_('y', 1);

    const solutions = run(1, conjN(eq(x, y), neq(x, y)));

    expect(solutions).toHaveLength(0);
  });

  it('accepts later bindings that make two variables different', () => {
    const x = var_('x', 0);
    const y = var_('y', 1);

    const solutions = run(1, conjN(neq(x, y), eq(x, lit('a')), eq(y, lit('b'))));

    expect(solutions).toHaveLength(1);
    expect(solutions[0]?.subst.data).toEqual([
      { key: x, value: lit('a') },
      { key: y, value: lit('b') },
    ]);
    expect(solutions[0]?.log).toEqual([]);
    expect(solutions[0]?.counter).toBe(0);
  });

  it('accepts earlier bindings that make two variables different', () => {
    const x = var_('x', 0);
    const y = var_('y', 1);

    const solutions = run(1, conjN(eq(x, lit('a')), eq(y, lit('b')), neq(x, y)));

    expect(solutions).toHaveLength(1);
    expect(solutions[0]?.subst.data).toEqual([
      { key: x, value: lit('a') },
      { key: y, value: lit('b') },
    ]);
    expect(solutions[0]?.log).toEqual([]);
    expect(solutions[0]?.counter).toBe(0);
  });
});

describe('neq with nested constraint resolution', () => {
  it('rejects a later binding that makes nested variables equal', () => {
    const x = var_('x', 0);
    const y = var_('y', 1);
    const left = con('term', 'pair', [x]);
    const right = con('term', 'pair', [y]);

    const solutions = run(1, conjN(neq(left, right), eq(x, y)));

    expect(solutions).toHaveLength(0);
  });

  it('rejects an earlier binding that makes nested variables equal', () => {
    const x = var_('x', 0);
    const y = var_('y', 1);
    const left = con('term', 'pair', [x]);
    const right = con('term', 'pair', [y]);

    const solutions = run(1, conjN(eq(x, y), neq(left, right)));

    expect(solutions).toHaveLength(0);
  });
});

describe('neq with different nested constraint resolution', () => {
  it('accepts later bindings that make nested variables different', () => {
    const x = var_('x', 0);
    const y = var_('y', 1);
    const left = con('term', 'pair', [x]);
    const right = con('term', 'pair', [y]);

    const solutions = run(1, conjN(neq(left, right), eq(x, lit('a')), eq(y, lit('b'))));

    expect(solutions).toHaveLength(1);
    expect(solutions[0]?.subst.data).toEqual([
      { key: x, value: lit('a') },
      { key: y, value: lit('b') },
    ]);
    expect(solutions[0]?.log).toEqual([]);
    expect(solutions[0]?.counter).toBe(0);
  });

  it('accepts earlier bindings that make nested variables different', () => {
    const x = var_('x', 0);
    const y = var_('y', 1);
    const left = con('term', 'pair', [x]);
    const right = con('term', 'pair', [y]);

    const solutions = run(1, conjN(eq(x, lit('a')), eq(y, lit('b')), neq(left, right)));

    expect(solutions).toHaveLength(1);
    expect(solutions[0]?.subst.data).toEqual([
      { key: x, value: lit('a') },
      { key: y, value: lit('b') },
    ]);
    expect(solutions[0]?.log).toEqual([]);
    expect(solutions[0]?.counter).toBe(0);
  });
});
