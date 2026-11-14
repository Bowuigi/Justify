import { describe, expect, it } from 'vitest';

import { conjN, delay, disjN, eq, run, type Goal } from '../mk.ts';
import { lit, var_ } from './helpers.ts';

type Solution = ReturnType<typeof run>[number];

function boundGoal(variableId: string, label: string): Goal {
  return eq(var_(variableId, 0), lit(label));
}

function failedGoal(): Goal {
  return eq(lit('expected'), lit('actual'));
}

function controlledDisjunction(): Goal {
  return disjN(
    boundGoal('result', 'first'),
    boundGoal('result', 'second'),
    boundGoal('result', 'third'),
  );
}

function boundLabel(solution: Solution, variableId: string): string {
  const bound = solution.subst.lastKey(key => key.id === variableId);
  if (bound?.is !== 'lit') {
    throw new Error(`Expected ${variableId} to be bound to a literal.`);
  }
  return bound.id;
}

function labels(solutions: Array<Solution>, variableId: string): Array<string> {
  return solutions.map(solution => boundLabel(solution, variableId));
}

describe('run', () => {
  it('returns no solutions when zero solutions are requested', () => {
    expect(run(0, controlledDisjunction())).toMatchInlineSnapshot(`
      []
    `);
  });

  it('returns only the first solution when one solution is requested', () => {
    expect(labels(run(1, controlledDisjunction()), 'result')).toMatchInlineSnapshot(`
      [
        "first",
      ]
    `);
  });

  it('returns all requested solutions in order', () => {
    expect(labels(run(3, controlledDisjunction()), 'result')).toMatchInlineSnapshot(`
      [
        "first",
        "second",
        "third",
      ]
    `);
  });
});

describe('disjN', () => {
  it('returns no solutions for an empty disjunction', () => {
    expect(run(1, disjN())).toMatchInlineSnapshot(`
      []
    `);
  });

  it('keeps successful branches in their controlled order', () => {
    const solutions = run(3, controlledDisjunction());

    expect(labels(solutions, 'result')).toMatchInlineSnapshot(`
      [
        "first",
        "second",
        "third",
      ]
    `);
  });

  it('continues after a failed branch', () => {
    const solutions = run(1, disjN(failedGoal(), boundGoal('result', 'after-failure')));

    expect(labels(solutions, 'result')).toMatchInlineSnapshot(`
      [
        "after-failure",
      ]
    `);
  });

  it('returns no solutions when every branch fails', () => {
    expect(run(1, disjN(failedGoal(), failedGoal()))).toMatchInlineSnapshot(`
      []
    `);
  });
});

describe('conjN', () => {
  it('returns one unchanged solution for an empty conjunction', () => {
    expect(run(1, conjN())).toMatchInlineSnapshot(`
      [
        {
          "constraints": {
            "neq": [],
          },
          "counter": 0,
          "log": [],
          "subst": AssocArray {
            "data": [],
          },
        },
      ]
    `);
  });
});

describe('conjN branches', () => {
  it('keeps successful branches in their controlled order', () => {
    const solutions = run(
      3,
      conjN(
        boundGoal('left', 'left-value'),
        disjN(boundGoal('right', 'right-one'), boundGoal('right', 'right-two')),
      ),
    );

    expect(
      solutions.map(solution => ({
        left: boundLabel(solution, 'left'),
        right: boundLabel(solution, 'right'),
      })),
    ).toMatchInlineSnapshot(`
      [
        {
          "left": "left-value",
          "right": "right-one",
        },
        {
          "left": "left-value",
          "right": "right-two",
        },
      ]
    `);
  });

  it('returns no solutions when a conjunction branch fails', () => {
    expect(run(1, conjN(boundGoal('left', 'left-value'), failedGoal()))).toMatchInlineSnapshot(`
      []
    `);
  });
});

describe('conjN backtracking', () => {
  it('backtracks from a failed branch into a later successful branch', () => {
    const solutions = run(
      1,
      conjN(boundGoal('left', 'left-value'), disjN(failedGoal(), boundGoal('right', 'recovered'))),
    );

    expect(
      solutions.map(solution => ({
        left: boundLabel(solution, 'left'),
        right: boundLabel(solution, 'right'),
      })),
    ).toMatchInlineSnapshot(`
      [
        {
          "left": "left-value",
          "right": "recovered",
        },
      ]
    `);
  });
});

describe('delay', () => {
  it('does not evaluate its goal until the stream is forced', () => {
    let initialState: Parameters<Goal>[0] | undefined;
    run(0, state => {
      initialState = state;
      return { is: 'nil' };
    });
    if (initialState === undefined) {
      throw new Error('Expected to capture the initial state.');
    }

    let evaluationCount = 0;
    const delayed = delay(() => {
      evaluationCount++;
      return { is: 'nil' };
    });
    const stream = delayed(initialState);

    expect({ evaluationCount, streamType: stream.is }).toMatchInlineSnapshot(`
      {
        "evaluationCount": 0,
        "streamType": "delayed",
      }
    `);

    if (stream.is !== 'delayed') {
      throw new Error('Expected a delayed stream.');
    }
    const forced = stream.force();

    expect({ evaluationCount, resultType: forced.is }).toMatchInlineSnapshot(`
      {
        "evaluationCount": 1,
        "resultType": "nil",
      }
    `);
  });
});
