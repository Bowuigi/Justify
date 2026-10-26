import type { JSX } from 'preact/jsx-runtime';

import { useLiveSystem } from '../hooks/use-live-system.tsx';
import { ToolGuard } from './tool-guard.tsx';

export function TryTool(): JSX.Element {
  const { verifiedSystem } = useLiveSystem();
  const system = verifiedSystem.value!;

  return (
    <ToolGuard>
      <div class="p-4 w-full h-full text-sm text-base-content">
        <p>{Object.keys(system.syntax).length} syntactic categories defined</p>
        <p>{Object.keys(system.relations).length} relations defined</p>
        <p>Query execution is a placeholder.</p>
      </div>
    </ToolGuard>
  );
}
