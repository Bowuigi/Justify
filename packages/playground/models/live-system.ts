import type { Diagnostic, System } from '@justify/core';
import { type Extension, runPipeline } from '@justify/markdown-dsl';
import {
  metadataExtension,
  relationMetaExtension,
  relationRuleExtension,
  syntaxExtension,
} from '@justify/markdown-dsl/extensions';
import { extractTeX } from '@justify/tex-extractor';
import { validateSystem } from '@justify/validator';
import {
  type ReadonlySignal,
  type Signal,
  batch,
  computed,
  createModel,
  effect,
  signal,
} from '@preact/signals';

export type LiveSystemState = { is: 'valid' } | { is: 'invalid'; diagnostics: Array<Diagnostic> };

export interface LiveSystemModel {
  editorBuffer: Signal<string>;
  state: ReadonlySignal<LiveSystemState>;
  verifiedSystem: ReadonlySignal<System>;
  preamble: ReadonlySignal<string>;
  outOfDate: ReadonlySignal<boolean>;
}

type ProcessingResult =
  | { status: 'valid'; system: System }
  | { status: 'invalid'; diagnostics: Array<Diagnostic> };

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
      status: 'invalid',
      diagnostics: [boundaryDiagnostic('markdown-dsl', 'The Markdown DSL failed unexpectedly.')],
    };
  }

  const { extracted, diagnostics } = result;

  if (diagnostics.length > 0) {
    return { status: 'invalid', diagnostics };
  }

  try {
    const semanticDiagnostics = validateSystem(extracted, FILENAME);
    if (semanticDiagnostics.length > 0) {
      return { status: 'invalid', diagnostics: semanticDiagnostics };
    }
  } catch {
    return {
      status: 'invalid',
      diagnostics: [boundaryDiagnostic('validator', 'The validator failed unexpectedly.')],
    };
  }

  return { status: 'valid', system: extracted };
}

function initialSystemError(diagnostics: Array<Diagnostic>): Error {
  const details = diagnostics
    .map(diagnostic =>
      diagnostic.message.map(part => (typeof part === 'string' ? part : part.text)).join(''),
    )
    .join('\n');

  return new Error(`The initial system must be valid.\n${details}`);
}

interface InternalSignals {
  editorBuffer: Signal<string>;
  state: Signal<LiveSystemState>;
  verifiedSystem: Signal<System>;
  preamble: Signal<string>;
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

      if (result.status === 'invalid') {
        state.value = { is: 'invalid', diagnostics: result.diagnostics };
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

    if (initialResult.status === 'invalid') {
      throw initialSystemError(initialResult.diagnostics);
    }

    const verifiedSystem = signal(initialResult.system);

    const signals: InternalSignals = {
      editorBuffer: signal(initialSource),
      state: signal<LiveSystemState>({ is: 'valid' }),
      verifiedSystem,
      preamble: computed(() => extractTeX(verifiedSystem.value)),
      outOfDate: signal(false),
    };

    startValidationLoop(signals);

    return signals;
  },
);
