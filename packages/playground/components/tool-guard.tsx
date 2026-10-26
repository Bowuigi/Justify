import type { ComponentChildren } from 'preact';
import type { JSX } from 'preact/jsx-runtime';

import { useLiveSystem } from '../hooks/use-live-system.tsx';

interface ToolGuardProps {
  children: ComponentChildren;
}

export function ToolGuard({ children }: ToolGuardProps): JSX.Element {
  const liveSystem = useLiveSystem();

  return (
    <div class="relative w-full h-full">
      {children}
      {liveSystem.outOfDate.value && (
        <span class="absolute bottom-2 right-2 badge badge-warning badge-md">Stale</span>
      )}
    </div>
  );
}
