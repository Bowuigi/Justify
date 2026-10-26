import type { JSX } from 'preact/jsx-runtime';

import { useLiveSystem } from '../hooks/use-live-system.tsx';
import { ToolGuard } from './tool-guard.tsx';

export function PreviewTool(): JSX.Element {
  const { verifiedSystem } = useLiveSystem();
  const system = verifiedSystem.value;

  return (
    <ToolGuard>
      <div class="p-4 w-full h-full text-sm text-base-content">
        <p>{Object.keys(system.syntax).length} syntactic categories</p>
        <p>Rendering is a placeholder.</p>
      </div>
    </ToolGuard>
  );
}
