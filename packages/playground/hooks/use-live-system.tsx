import { createContext, type ComponentChildren, type JSX } from 'preact';
import { useContext } from 'preact/hooks';

import type { LiveSystemModel } from '../models/live-system.ts';

const LiveSystemContext = createContext<LiveSystemModel | null>(null);

interface LiveSystemProviderProps {
  model: LiveSystemModel;
  children: ComponentChildren;
}

export function LiveSystemProvider({ model, children }: LiveSystemProviderProps): JSX.Element {
  return <LiveSystemContext.Provider value={model}>{children}</LiveSystemContext.Provider>;
}

export function useLiveSystem(): LiveSystemModel {
  const model = useContext(LiveSystemContext);

  if (model === null) {
    throw new Error(
      'useLiveSystem-dependent components must be rendered inside a LiveSystemProvider.',
    );
  }

  return model;
}
