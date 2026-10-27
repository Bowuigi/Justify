import type { JSX } from 'preact/jsx-runtime';

import { useLiveSystem } from '../hooks/use-live-system.tsx';
import { Editor } from './editor.tsx';

export function EditTool(): JSX.Element {
  const { editorBuffer } = useLiveSystem();

  return (
    <div class="h-full w-full">
      <Editor buffer={editorBuffer} />
    </div>
  );
}
