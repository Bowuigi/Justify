import type { JSX } from 'preact/jsx-runtime';

import { liveSystem } from '../models/live-system.ts';
import { Editor } from './editor.tsx';

export function EditTool(): JSX.Element {
  return (
    <div>
      <Editor buffer={liveSystem.editorBuffer} />
    </div>
  );
}
