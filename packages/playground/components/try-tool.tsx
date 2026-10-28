import { useEffect, useMemo, useState } from 'preact/hooks';
import type { JSX } from 'preact/jsx-runtime';

import { useLiveSystem } from '../hooks/use-live-system.tsx';
import { type TryOutcome, type TrySolution, tryQuery } from '../lib/try.ts';
import { DiagnosticCard } from './diagnostic-card.tsx';
import { TexBlock } from './tex-block.tsx';
import { ToolGuard } from './tool-guard.tsx';

function Solution({ solution, index }: { solution: TrySolution; index: number }): JSX.Element {
  return (
    <div class="rounded-lg p-3 mb-2" data-testid="try-solution">
      <h2>Solution N° {index + 1}:</h2>
      {solution.bindings.length > 0 && (
        <div class="mb-2">
          <h3 class="font-semibold mb-1">Bindings</h3>
          <div class="space-y-1 ml-4">
            {solution.bindings.map((binding, ix) => (
              <div key={ix} class="flex items-baseline gap-1">
                <span class="font-semibold">{binding.id}</span>
                {', '}
                <span class="font-semibold">{binding.texId}</span>
                {' = '}
                <TexBlock expression={binding.texValue} class="inline-block" />
              </div>
            ))}
          </div>
        </div>
      )}
      {solution.derivationTeX !== null && (
        <div class="mt-1">
          <h3 class="font-semibold mb-1">Derivation</h3>
          <TexBlock expression={solution.derivationTeX} />
        </div>
      )}
    </div>
  );
}

function SolutionsList({ solutions }: { solutions: Array<TrySolution> | null }): JSX.Element {
  if (solutions === null) {
    return <p class="text-base-content/50 italic">Enter a Query to get started.</p>;
  }
  if (solutions.length === 0) {
    return <p class="text-base-content/50">No solutions.</p>;
  }
  return (
    <div class="space-y-2">
      {solutions.map((solution, index) => (
        <Solution key={index} solution={solution} index={index} />
      ))}
    </div>
  );
}

function ResultPanel({
  showPreviousLabel,
  solutions,
}: {
  showPreviousLabel: boolean;
  solutions: Array<TrySolution> | null;
}): JSX.Element {
  return (
    <div class="mt-3 flex-1 min-h-0 overflow-auto border border-base-300 p-2">
      {showPreviousLabel && (
        <div class="font-semibold mb-1 text-base-content/70">Previous result</div>
      )}
      <SolutionsList solutions={solutions} />
    </div>
  );
}

interface QueryEditorProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  disabled: boolean;
}

function QueryEditor({ value, onChange, onClear, disabled }: QueryEditorProps): JSX.Element {
  return (
    <div class="flex-1 min-h-0 overflow-hidden flex flex-col">
      <label class="mb-1 block">Query (JSON)</label>
      <textarea
        class="h-full w-full textarea textarea-bordered flex-1 min-h-0"
        value={value}
        onInput={ev => {
          onChange(ev.currentTarget.value);
        }}
      />
      <div class="mt-2 flex gap-2">
        <button class="btn btn-sm btn-error" onClick={onClear} disabled={disabled}>
          Clear
        </button>
      </div>
    </div>
  );
}

function TryToolContent({
  queryText,
  onChange,
  onClear,
  clearDisabled,
  outcome,
  lastResult,
}: {
  queryText: string;
  onChange: (value: string) => void;
  onClear: () => void;
  clearDisabled: boolean;
  outcome: TryOutcome;
  lastResult: Array<TrySolution> | null;
}): JSX.Element {
  const showPreviousLabel = outcome.status === 'invalid' && lastResult !== null;

  let resultSolutions: Array<TrySolution> | null;
  if (outcome.status === 'success') {
    resultSolutions = outcome.solutions;
  } else if (outcome.status === 'empty') {
    resultSolutions = null;
  } else {
    resultSolutions = lastResult ?? null;
  }

  return (
    <ToolGuard>
      <div class="p-4 w-full h-full flex flex-col text-sm text-base-content">
        <QueryEditor
          value={queryText}
          onChange={onChange}
          onClear={onClear}
          disabled={clearDisabled}
        />
        {outcome.status === 'invalid' && (
          <div class="mt-3 space-y-2">
            {outcome.diagnostics.map((diagnostic, index) => (
              <DiagnosticCard key={index} diagnostic={diagnostic} />
            ))}
          </div>
        )}
        {outcome.status === 'fatal' && (
          <div class="mt-3 p-3 rounded bg-error text-error-content">{outcome.message}</div>
        )}
        <ResultPanel showPreviousLabel={showPreviousLabel} solutions={resultSolutions} />
      </div>
    </ToolGuard>
  );
}

export function TryTool(): JSX.Element {
  const { verifiedSystem } = useLiveSystem();
  const system = verifiedSystem.value;

  const [queryText, setQueryText] = useState('');
  const [lastResult, setLastResult] = useState<Array<TrySolution> | null>(null);

  const outcome: TryOutcome = useMemo(() => tryQuery(queryText, system), [queryText, system]);

  useEffect(() => {
    if (outcome.status === 'success') {
      setLastResult(outcome.solutions);
    } else if (outcome.status === 'empty') {
      // Invalid and fatal outcomes keep the last successful result visible.
      setLastResult(null);
    }
  }, [outcome]);

  const clear = (): void => {
    setQueryText('');
    setLastResult(null);
  };

  const clearDisabled = queryText === '' && lastResult === null && outcome.status !== 'invalid';

  return (
    <TryToolContent
      queryText={queryText}
      onChange={setQueryText}
      onClear={clear}
      clearDisabled={clearDisabled}
      outcome={outcome}
      lastResult={lastResult}
    />
  );
}
