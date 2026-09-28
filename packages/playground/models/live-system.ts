//// Currently unused, but useful for seeing how tool state will be stored
import { type Signal, createModel, signal } from '@preact/signals';

interface LiveSystem {
  editorBuffer: Signal<string>;
}

export const LiveSystemModel = createModel<LiveSystem>(() => {
  const editorBuffer = signal('');
  // Debouncing?
  // The live syntax tree would be computed()
  // The latest valid live syntax tree would be computed()

  return {
    editorBuffer,
  };
});
