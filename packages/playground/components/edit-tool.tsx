import type { JSX } from 'preact/jsx-runtime';

import { liveSystem } from '../models/live-system.ts';
import { Editor } from './editor.tsx';

export function EditTool(): JSX.Element {
  return (
    <div class="h-full w-full">
      <Editor buffer={liveSystem.editorBuffer} />
    </div>
  );
}
