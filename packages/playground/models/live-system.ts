import { type Signal, createModel, signal } from '@preact/signals';

import baseSystem from '../base-system.jtf.md?raw';

interface LiveSystem {
  editorBuffer: Signal<string>;
}

const LiveSystemModel = createModel<LiveSystem>(() => {
  const editorBuffer = signal(baseSystem);

  return {
    editorBuffer,
  };
});

export const liveSystem = new LiveSystemModel();
