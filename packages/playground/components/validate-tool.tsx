import type { JSX } from 'preact/jsx-runtime';

import { useLiveSystem } from '../hooks/use-live-system.tsx';
import { DiagnosticCard } from './diagnostic-card.tsx';

export function ValidateTool(): JSX.Element {
  const liveSystem = useLiveSystem();
  const state = liveSystem.state.value;

  if (state.is === 'valid') {
    return (
      <div class="p-4 w-full h-full text-sm text-base-content">
        <p>All good!</p>
      </div>
    );
  }

  return (
    <div class="p-4 w-full h-full text-sm text-base-content overflow-auto">
      {state.diagnostics.map((diagnostic, index) => (
        <DiagnosticCard key={index} diagnostic={diagnostic} />
      ))}
    </div>
  );
}
