import type * as MarkdownDsl from '@justify/markdown-dsl';
import type * as Validator from '@justify/validator';
import { type Model, useModel } from '@preact/signals';
import { renderHook } from '@testing-library/preact';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import baseSystem from '../base-system.jtf.md?raw';
import { type LiveSystemModel, LiveSystemModelClass } from '../models/live-system.ts';

const boundaries = vi.hoisted(() => ({ throwPipeline: false, throwValidator: false }));

vi.mock('@justify/markdown-dsl', async importOriginal => {
  const actual = await importOriginal<typeof MarkdownDsl>();
  return {
    ...actual,
    runPipeline: (...args: Parameters<typeof actual.runPipeline>) => {
      if (boundaries.throwPipeline) throw new Error('pipeline exploded');
      return actual.runPipeline(...args);
    },
  };
});

vi.mock('@justify/validator', async importOriginal => {
  const actual = await importOriginal<typeof Validator>();
  return {
    ...actual,
    validateSystem: (...args: Parameters<typeof actual.validateSystem>) => {
      if (boundaries.throwValidator) throw new Error('validator exploded');
      return actual.validateSystem(...args);
    },
  };
});

function create(initial: string = baseSystem): Model<LiveSystemModel> {
  const { result } = renderHook(() => useModel(() => new LiveSystemModelClass(initial)));
  return result.current;
}

function changeDescription(source: string, description: string): string {
  return source.replace(/^description: .*$/m, `description: ${description}`);
}

function advance(ms: number): void {
  vi.advanceTimersByTime(ms);
}

beforeEach(() => {
  vi.useFakeTimers();
  boundaries.throwPipeline = false;
  boundaries.throwValidator = false;
});

describe('live system model initial state', () => {
  it('produces a valid state and a verified system for the initial base system', () => {
    const live = create();

    expect(live.state.value).toEqual({ is: 'valid' });
    expect(live.verifiedSystem.value).toBeDefined();
    expect(live.outOfDate.value).toBe(false);
  });

  it('rejects an invalid initial system', () => {
    expect(() => create('   \n')).toThrow('The initial system must be valid');
  });
});

describe('live system model debounce', () => {
  it('does not change the state before 300 ms', () => {
    const live = create();
    live.editorBuffer.value = changeDescription(baseSystem, '[');

    advance(299);

    expect(live.state.value).toEqual({ is: 'valid' });
  });

  it('changes the state after 300 ms', () => {
    const live = create();
    live.editorBuffer.value = changeDescription(baseSystem, '[');

    advance(300);

    expect(live.state.value.is).toBe('invalid');
  });

  it('cancels an earlier timer when a later edit arrives', () => {
    const live = create();
    live.editorBuffer.value = changeDescription(baseSystem, 'First');

    advance(250);
    live.editorBuffer.value = changeDescription(baseSystem, '[');

    advance(100);
    expect(live.state.value).toEqual({ is: 'valid' });

    advance(200);
    expect(live.state.value.is).toBe('invalid');
  });
});

describe('live system model diagnostics', () => {
  it('produces only Markdown DSL diagnostics for a Markdown error', () => {
    const live = create();
    live.editorBuffer.value = changeDescription(baseSystem, '[');

    advance(300);

    const state = live.state.value;
    expect(state.is).toBe('invalid');
    if (state.is !== 'invalid') return;
    expect(state.diagnostics.length).toBeGreaterThan(0);
    expect(state.diagnostics.every(diagnostic => diagnostic.origin === 'markdown-dsl')).toBe(true);
  });

  it('produces validator diagnostics for a semantic error', () => {
    const live = create();
    live.editorBuffer.value = baseSystem.replace('add x y z', 'missing x y z');

    advance(300);

    const state = live.state.value;
    expect(state.is).toBe('invalid');
    if (state.is !== 'invalid') return;
    expect(state.diagnostics.length).toBeGreaterThan(0);
    expect(state.diagnostics.every(diagnostic => diagnostic.origin === 'validator')).toBe(true);
  });

  it('keeps the previous verified system after an invalid attempt', () => {
    const live = create();
    const previous = live.verifiedSystem.value;

    live.editorBuffer.value = changeDescription(baseSystem, '[');
    advance(300);

    expect(live.verifiedSystem.value).toBe(previous);
  });
});

describe('live system model staleness', () => {
  it('becomes stale immediately after an editor change', () => {
    const live = create();
    live.editorBuffer.value = changeDescription(baseSystem, 'Changed');

    expect(live.outOfDate.value).toBe(true);
  });

  it('stays stale after an invalid attempt', () => {
    const live = create();
    live.editorBuffer.value = changeDescription(baseSystem, '[');

    advance(300);

    expect(live.state.value.is).toBe('invalid');
    expect(live.outOfDate.value).toBe(true);
  });

  it('clears the stale state after a successful attempt', () => {
    const live = create();
    live.editorBuffer.value = changeDescription(baseSystem, 'Changed');
    advance(300);

    expect(live.outOfDate.value).toBe(false);
  });
});

describe('live system model undo', () => {
  it('stays stale when undoing to known-good text until validation succeeds', () => {
    const live = create();
    const knownGood = changeDescription(baseSystem, 'Known good');
    live.editorBuffer.value = knownGood;
    advance(300);
    expect(live.outOfDate.value).toBe(false);

    live.editorBuffer.value = changeDescription(baseSystem, '[');
    advance(300);
    expect(live.outOfDate.value).toBe(true);

    live.editorBuffer.value = knownGood;
    expect(live.outOfDate.value).toBe(true);

    advance(299);
    expect(live.outOfDate.value).toBe(true);

    advance(1);
    expect(live.outOfDate.value).toBe(false);
  });
});

describe('live system model whitespace-only buffer', () => {
  it('produces an invalid state and keeps the verified system', () => {
    const live = create();
    const previous = live.verifiedSystem.value;

    live.editorBuffer.value = '   \n';
    advance(300);

    const state = live.state.value;
    expect(state.is).toBe('invalid');
    if (state.is !== 'invalid') return;
    expect(state.diagnostics[0]?.message).toEqual([
      'No metadata provided at the start of the document',
    ]);
    expect(live.verifiedSystem.value).toBe(previous);
    expect(live.outOfDate.value).toBe(true);
  });
});

describe('live system model error boundary', () => {
  it('survives an unexpected Markdown DSL error without removing the verified system', () => {
    const live = create();
    const previous = live.verifiedSystem.value;

    boundaries.throwPipeline = true;
    live.editorBuffer.value = changeDescription(baseSystem, 'Changed');
    advance(300);

    const state = live.state.value;
    expect(state.is).toBe('invalid');
    if (state.is !== 'invalid') return;
    expect(state.diagnostics).toHaveLength(1);
    expect(state.diagnostics[0]?.origin).toBe('markdown-dsl');
    expect(live.verifiedSystem.value).toBe(previous);
    expect(live.outOfDate.value).toBe(true);
  });

  it('survives an unexpected validator error without removing the verified system', () => {
    const live = create();
    const previous = live.verifiedSystem.value;

    boundaries.throwValidator = true;
    live.editorBuffer.value = changeDescription(baseSystem, 'Changed');
    advance(300);

    const state = live.state.value;
    expect(state.is).toBe('invalid');
    if (state.is !== 'invalid') return;
    expect(state.diagnostics).toHaveLength(1);
    expect(state.diagnostics[0]?.origin).toBe('validator');
    expect(live.verifiedSystem.value).toBe(previous);
    expect(live.outOfDate.value).toBe(true);
  });
});
