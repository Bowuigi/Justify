import type { Diagnostic, System } from '@justify/core';
import { type Extension, runPipeline } from '@justify/markdown-dsl';
import {
  metadataExtension,
  relationMetaExtension,
  relationRuleExtension,
  syntaxExtension,
} from '@justify/markdown-dsl/extensions';
import { validateSystem } from '@justify/validator';
import {
  type ReadonlySignal,
  type Signal,
  batch,
  createModel,
  effect,
  signal,
} from '@preact/signals';

export type LiveSystemState = { is: 'valid' } | { is: 'invalid'; diagnostics: Array<Diagnostic> };

export interface LiveSystemModel {
  editorBuffer: Signal<string>;
  state: ReadonlySignal<LiveSystemState>;
  verifiedSystem: ReadonlySignal<System | null>;
  outOfDate: ReadonlySignal<boolean>;
}

interface ProcessingResult {
  state: LiveSystemState;
  system: System | null;
}

const FILENAME = '<editor>';
const DEBOUNCE_MS = 300;
const EXTENSIONS: Array<Extension> = [
  metadataExtension,
  syntaxExtension,
  relationMetaExtension,
  relationRuleExtension,
];

function boundaryDiagnostic(origin: Diagnostic['origin'], message: string): Diagnostic {
  return { source: FILENAME, origin, message: [message], hints: [], relatedLocations: [] };
}

function process(markdown: string): ProcessingResult {
  let result: ReturnType<typeof runPipeline>;

  try {
    result = runPipeline(markdown, FILENAME, EXTENSIONS);
  } catch {
    return {
      state: {
        is: 'invalid',
        diagnostics: [boundaryDiagnostic('markdown-dsl', 'The Markdown DSL failed unexpectedly.')],
      },
      system: null,
    };
  }

  const { extracted, diagnostics } = result;

  if (diagnostics.length > 0) {
    return { state: { is: 'invalid', diagnostics }, system: null };
  }

  try {
    const semanticDiagnostics = validateSystem(extracted, FILENAME);
    if (semanticDiagnostics.length > 0) {
      return { state: { is: 'invalid', diagnostics: semanticDiagnostics }, system: null };
    }
  } catch {
    return {
      state: {
        is: 'invalid',
        diagnostics: [boundaryDiagnostic('validator', 'The validator failed unexpectedly.')],
      },
      system: null,
    };
  }

  return { state: { is: 'valid' }, system: extracted };
}

interface InternalSignals {
  editorBuffer: Signal<string>;
  state: Signal<LiveSystemState>;
  verifiedSystem: Signal<System | null>;
  outOfDate: Signal<boolean>;
}

function startValidationLoop(signals: InternalSignals): void {
  const { editorBuffer, state, verifiedSystem, outOfDate } = signals;

  let timer: ReturnType<typeof setTimeout> | null = null;
  let isFirstRun = true;

  effect(() => {
    const markdown = editorBuffer.value;

    if (isFirstRun) {
      isFirstRun = false;
      return;
    }

    outOfDate.value = true;
    timer = setTimeout(() => {
      timer = null;
      const result = process(markdown);

      if (result.system === null) {
        state.value = result.state;
        return;
      }

      batch(() => {
        state.value = { is: 'valid' };
        verifiedSystem.value = result.system;
        outOfDate.value = false;
      });
    }, DEBOUNCE_MS);

    return () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    };
  });
}

export const LiveSystemModelClass = createModel<LiveSystemModel, [string]>(
  (initialSource: string) => {
    const initialResult = process(initialSource);

    const signals: InternalSignals = {
      editorBuffer: signal(initialSource),
      state: signal<LiveSystemState>(initialResult.state),
      verifiedSystem: signal<System | null>(initialResult.system),
      outOfDate: signal(false),
    };

    startValidationLoop(signals);

    return signals;
  },
);
