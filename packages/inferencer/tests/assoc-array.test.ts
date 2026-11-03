import { describe, expect, it } from 'vitest';

import { AssocArray } from '../assoc-array.ts';

describe('AssocArray', () => {
  it('returns null when looking up an empty array', () => {
    const assoc = new AssocArray<string, number>([]);

    expect(assoc.lastKey(key => key === 'missing')).toBeNull();
  });

  it('returns the value from the last matching entry', () => {
    const assoc = new AssocArray([
      { key: 'target', value: 1 },
      { key: 'other', value: 2 },
      { key: 'target', value: 3 },
    ]);

    expect(assoc.lastKey(key => key === 'target')).toBe(3);
  });

  it('returns null when no entry matches', () => {
    const assoc = new AssocArray([
      { key: 'first', value: 1 },
      { key: 'second', value: 2 },
    ]);

    expect(assoc.lastKey(key => key === 'missing')).toBeNull();
  });

  it('preserves insertion order', () => {
    const assoc = new AssocArray<string, number>([{ key: 'first', value: 1 }]);
    const extended = assoc.insert('second', 2).insert('third', 3);

    expect(extended.data).toEqual([
      { key: 'first', value: 1 },
      { key: 'second', value: 2 },
      { key: 'third', value: 3 },
    ]);
  });

  it('inserts without changing the original instance', () => {
    const original = new AssocArray<string, number>([{ key: 'first', value: 1 }]);
    const extended = original.insert('second', 2);

    expect(extended).not.toBe(original);
    expect(original.data).toEqual([{ key: 'first', value: 1 }]);
    expect(extended.data).toEqual([
      { key: 'first', value: 1 },
      { key: 'second', value: 2 },
    ]);
  });
});
