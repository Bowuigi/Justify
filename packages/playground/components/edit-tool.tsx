import type { JSX } from 'preact/jsx-runtime';
import * as RSCE from 'react-simple-code-editor';

import { liveSystem } from '../models/live-system.ts';

// JS ecosystem moment: https://rolldown.rs/in-depth/bundling-cjs#ambiguous-default-import-from-cjs-modules
const Editor = RSCE.default.default;

export function EditTool(): JSX.Element {
  return (
    <div class="p-2 w-full h-full text-base-content">
      <Editor
        value={liveSystem.editorBuffer.value}
        onValueChange={code => {
          liveSystem.editorBuffer.value = code;
        }}
        highlight={code => code}
        class="w-full h-full"
      />
    </div>
  );
}
