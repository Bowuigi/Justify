import { useModel } from '@preact/signals';
import { renderHook } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import baseSystem from '../base-system.jtf.md?raw';
import {
  BUFFER_KEY,
  readStoredBuffer,
  resolveEditorStartup,
  useEditorPersistence,
  writeStoredBuffer,
} from '../hooks/use-editor-persistence.ts';
import { type LiveSystemModel, LiveSystemModelClass } from '../models/live-system.ts';

function changeDescription(source: string, description: string): string {
  return source.replace(/^description: .*$/m, `description: ${description}`);
}

function createPersisted(initialBuffer: string | null): LiveSystemModel {
  const { result } = renderHook(() => {
    const model = useModel(() => new LiveSystemModelClass(baseSystem));
    useEditorPersistence(model, initialBuffer);
    return model;
  });

  return result.current;
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('editor buffer storage', () => {
  it('reads a stored buffer', () => {
    localStorage.setItem(BUFFER_KEY, 'stored buffer');

    expect(readStoredBuffer()).toEqual({ buffer: 'stored buffer', error: false });
  });

  it('returns null for a missing buffer', () => {
    expect(readStoredBuffer()).toEqual({ buffer: null, error: false });
  });

  it('returns null for empty and whitespace-only values', () => {
    localStorage.setItem(BUFFER_KEY, '   \n\t');

    expect(readStoredBuffer()).toEqual({ buffer: null, error: false });
  });

  it('returns an absent buffer and an error flag when reading throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });

    expect(readStoredBuffer()).toEqual({ buffer: null, error: true });
  });

  it('writes a stored buffer', () => {
    expect(writeStoredBuffer('buffer')).toBe(true);
    expect(localStorage.getItem(BUFFER_KEY)).toBe('buffer');
  });

  it('returns false when writing throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });

    expect(writeStoredBuffer('buffer')).toBe(false);
  });
});

describe('editor startup resolver', () => {
  it('uses a valid stored buffer as the base', () => {
    const stored = changeDescription(baseSystem, 'Stored valid');
    localStorage.setItem(BUFFER_KEY, stored);

    const startup = resolveEditorStartup(baseSystem);

    expect(startup.baseSource).toBe(stored);
    expect(startup.initialBuffer).toBeNull();
  });

  it('falls back to the base system for an invalid stored buffer', () => {
    const invalid = changeDescription(baseSystem, '[');
    localStorage.setItem(BUFFER_KEY, invalid);

    const startup = resolveEditorStartup(baseSystem);

    expect(startup.baseSource).toBe(baseSystem);
    expect(startup.initialBuffer).toBe(invalid);
  });

  it('uses the base system when nothing is stored', () => {
    const startup = resolveEditorStartup(baseSystem);

    expect(startup.baseSource).toBe(baseSystem);
    expect(startup.initialBuffer).toBeNull();
  });

  it('reports a storage read error', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });

    const startup = resolveEditorStartup(baseSystem);

    expect(startup.baseSource).toBe(baseSystem);
    expect(startup.storageError).toBe(true);
  });
});

describe('editor persistence', () => {
  it('saves the buffer after the validation tick', () => {
    vi.useFakeTimers();
    const live = createPersisted(null);
    const changed = changeDescription(baseSystem, 'Changed');

    live.editorBuffer.value = changed;
    vi.advanceTimersByTime(300);

    expect(localStorage.getItem(BUFFER_KEY)).toBe(changed);
  });

  it('saves an invalid buffer after the validation tick', () => {
    vi.useFakeTimers();
    const live = createPersisted(null);
    const invalid = changeDescription(baseSystem, '[');

    live.editorBuffer.value = invalid;
    vi.advanceTimersByTime(300);

    expect(localStorage.getItem(BUFFER_KEY)).toBe(invalid);
  });

  it('restores the initial buffer after mount', () => {
    const stored = changeDescription(baseSystem, 'Restored');
    const live = createPersisted(stored);

    expect(live.editorBuffer.peek()).toBe(stored);
    expect(localStorage.getItem(BUFFER_KEY)).toBe(stored);
  });

  it('keeps the base buffer when there is nothing to restore', () => {
    const live = createPersisted(null);

    expect(live.editorBuffer.peek()).toBe(baseSystem);
    expect(localStorage.getItem(BUFFER_KEY)).toBe(baseSystem);
  });
});
