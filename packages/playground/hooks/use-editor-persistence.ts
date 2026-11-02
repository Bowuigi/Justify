import { effect } from '@preact/signals';
import { useEffect } from 'preact/hooks';

import { type LiveSystemModel, processSystemSource } from '../models/live-system.ts';

export const BUFFER_KEY = 'justify-editor-buffer';

export interface StoredBufferRead {
  buffer: string | null;
  error: boolean;
}

export interface EditorStartup {
  baseSource: string;
  initialBuffer: string | null;
  storageError: boolean;
}

export function readStoredBuffer(): StoredBufferRead {
  try {
    const value = globalThis.localStorage.getItem(BUFFER_KEY);
    return {
      buffer: value !== null && value.trim() !== '' ? value : null,
      error: false,
    };
  } catch {
    return { buffer: null, error: true };
  }
}

export function writeStoredBuffer(source: string): boolean {
  try {
    globalThis.localStorage.setItem(BUFFER_KEY, source);
    return true;
  } catch {
    return false;
  }
}

export function resolveEditorStartup(baseSystem: string): EditorStartup {
  const { buffer, error } = readStoredBuffer();

  if (buffer !== null && processSystemSource(buffer).status === 'valid') {
    return { baseSource: buffer, initialBuffer: null, storageError: error };
  }

  return { baseSource: baseSystem, initialBuffer: buffer, storageError: error };
}

export function useEditorPersistence(model: LiveSystemModel, initialBuffer: string | null): void {
  useEffect(() => {
    if (initialBuffer !== null) {
      model.editorBuffer.value = initialBuffer;
    }

    return effect(() => {
      switch (model.state.value.is) {
        case 'valid':
        case 'invalid': {
          writeStoredBuffer(model.editorBuffer.peek());
          break;
        }
      }
    });
  }, []);
}
