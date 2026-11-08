import type { Term as STerm } from '@justify/core';
import { describe, expect, it } from 'vitest';

import { convertTermWithPool, eq, fresh, run, type VarPool } from '../mk.ts';
import { con, lit, var_ } from './helpers.ts';

function captureError(callback: () => unknown): unknown {
  try {
    callback();
  } catch (error: unknown) {
    return error;
  }
  throw new Error('Expected the callback to throw.');
}

describe('convertTermWithPool', () => {
  it('converts a literal reference to a literal term', () => {
    const term = convertTermWithPool({ is: 'ref', to: 'var' }, {}, ['var']);

    expect(term).toEqual({ is: 'lit', id: 'var' });
  });

  it('uses the existing variable from the pool', () => {
    const pooledVariable = var_('x', 3);
    const pool: VarPool = { x: pooledVariable };

    const term = convertTermWithPool({ is: 'ref', to: 'x' }, pool, []);

    expect(term).toBe(pooledVariable);
  });
});

describe('convertTermWithPool constructors', () => {
  it('converts nested constructor arguments', () => {
    const pooledVariable = var_('x', 3);
    const pool: VarPool = { x: pooledVariable };
    const sterm: STerm = {
      is: 'con',
      from: 'term',
      tag: 'pair',
      args: [
        { is: 'ref', to: 'x' },
        {
          is: 'con',
          from: 'term',
          tag: 'unit',
          args: [
            { is: 'ref', to: 'x' },
            { is: 'ref', to: 'var' },
          ],
        },
      ],
    };

    const term = convertTermWithPool(sterm, pool, ['var']);

    expect(term).toEqual({
      is: 'con',
      from: 'term',
      tag: 'pair',
      args: [
        pooledVariable,
        {
          is: 'con',
          from: 'term',
          tag: 'unit',
          args: [pooledVariable, { is: 'lit', id: 'var' }],
        },
      ],
    });
  });
});

describe('convertTermWithPool errors', () => {
  it('reports an unbound identifier with its available names', () => {
    const pool: VarPool = { x: var_('x', 0) };

    const error = captureError(() =>
      convertTermWithPool({ is: 'ref', to: 'missing' }, pool, ['var']),
    );

    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({
      name: 'UnboundIdentifierError',
      message: expect.stringContaining("Unbound identifier 'missing'"),
      variable: 'missing',
      variableList: ['x'],
      literalList: ['var'],
    });
  });
});

describe('eq with variables and literals', () => {
  it('succeeds for identical variables without adding a substitution', () => {
    const x = var_('x', 0);

    const solutions = run(1, eq(x, x));

    expect(solutions).toHaveLength(1);
    expect(solutions[0]?.subst.data).toEqual([]);
  });

  it('binds a variable to another term', () => {
    const x = var_('x', 0);
    const y = var_('y', 1);

    const solutions = run(1, eq(x, y));

    expect(solutions).toHaveLength(1);
    expect(solutions[0]?.subst.data).toEqual([{ key: x, value: y }]);
  });

  it('succeeds for matching literals', () => {
    const solutions = run(1, eq(lit('var'), lit('var')));

    expect(solutions).toHaveLength(1);
    expect(solutions[0]?.subst.data).toEqual([]);
  });

  it('fails for mismatched literals', () => {
    const solutions = run(1, eq(lit('var'), lit('false')));

    expect(solutions).toHaveLength(0);
  });
});

describe('eq with constructors', () => {
  it('succeeds for matching constructors', () => {
    const left = con('term', 'unit', []);
    const right = con('term', 'unit', []);

    const solutions = run(1, eq(left, right));

    expect(solutions).toHaveLength(1);
    expect(solutions[0]?.subst.data).toEqual([]);
  });

  it('unifies variables inside nested constructors', () => {
    const x = var_('x', 0);
    const y = var_('y', 1);
    const left = con('term', 'pair', [x, con('term', 'pair', [y])]);
    const right = con('term', 'pair', [lit('first'), con('term', 'pair', [lit('second')])]);

    const solutions = run(1, eq(left, right));

    expect(solutions).toHaveLength(1);
    expect(solutions[0]?.subst.data).toEqual([
      { key: x, value: lit('first') },
      { key: y, value: lit('second') },
    ]);
  });

  it('fails for constructors with different tags', () => {
    const left = con('term', 'unit', []);
    const right = con('term', 'pair', []);

    const solutions = run(1, eq(left, right));

    expect(solutions).toHaveLength(0);
  });

  it('fails for nested constructors with different tags', () => {
    const left = con('term', 'pair', [con('term', 'unit', [])]);
    const right = con('term', 'pair', [con('term', 'pair', [])]);

    const solutions = run(1, eq(left, right));

    expect(solutions).toHaveLength(0);
  });
});

describe('eq with the occurs check', () => {
  it('fails instead of throwing for a direct recursive binding', () => {
    const x = var_('x', 0);
    const recursive = con('term', 'pair', [x]);

    expect(run(1, eq(x, recursive))).toHaveLength(0);
  });

  it('fails instead of throwing for an indirect nested recursive binding', () => {
    const x = var_('x', 0);
    const y = var_('y', 1);
    const [solution] = run(1, eq(x, y));
    const recursive = con('term', 'pair', [con('term', 'pair', [x])]);

    expect(solution).toBeDefined();
    expect(eq(y, recursive)(solution!)).toMatchObject({ is: 'nil' });
  });
});

describe('fresh pool creation', () => {
  it('creates one pooled variable for every requested identifier', () => {
    let pool: VarPool = {};

    run(
      1,
      fresh(['x', 'y'], createdPool => {
        pool = createdPool;
        return eq(createdPool.x!, createdPool.x!);
      }),
    );

    expect(pool).toMatchInlineSnapshot(`
      {
        "x": {
          "counter": 0,
          "id": "x",
          "is": "var",
        },
        "y": {
          "counter": 1,
          "id": "y",
          "is": "var",
        },
      }
    `);
  });
});

describe('fresh counter allocation', () => {
  it('allocates consecutive counters to pooled variables', () => {
    let pool: VarPool = {};

    run(
      1,
      fresh(['first', 'second'], createdPool => {
        pool = createdPool;
        return eq(createdPool.first!, createdPool.first!);
      }),
    );

    expect(pool).toMatchInlineSnapshot(`
      {
        "first": {
          "counter": 0,
          "id": "first",
          "is": "var",
        },
        "second": {
          "counter": 1,
          "id": "second",
          "is": "var",
        },
      }
    `);
  });
});

describe('fresh state management', () => {
  it('updates the state counter after allocating the pool', () => {
    const solutions = run(
      1,
      fresh(['x', 'y'], pool => eq(pool.x!, pool.x!)),
    );

    expect(solutions.map(solution => solution.counter)).toMatchInlineSnapshot(`
      [
        2,
      ]
    `);
  });
});

describe('fresh variable identity', () => {
  it('keeps variables from separate fresh scopes distinct', () => {
    let outerPool: VarPool = {};
    let innerPool: VarPool = {};

    const solutions = run(
      1,
      fresh(['x'], outer => {
        outerPool = outer;
        return fresh(['x'], inner => {
          innerPool = inner;
          return eq(outer.x!, inner.x!);
        });
      }),
    );

    expect(outerPool.x!).not.toBe(innerPool.x!);
    expect({
      outer: outerPool.x!,
      inner: innerPool.x!,
    }).toMatchInlineSnapshot(`
      {
        "inner": {
          "counter": 1,
          "id": "x",
          "is": "var",
        },
        "outer": {
          "counter": 0,
          "id": "x",
          "is": "var",
        },
      }
    `);
    expect(solutions[0]?.subst.data).toEqual([{ key: outerPool.x!, value: innerPool.x! }]);
  });
});
