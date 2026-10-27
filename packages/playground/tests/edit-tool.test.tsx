import { useModel } from '@preact/signals';
import { render } from '@testing-library/preact';
import type { JSX } from 'preact';
import { describe, it, expect } from 'vitest';

import baseSystem from '../base-system.jtf.md?raw';
import { EditTool } from '../components/edit-tool.tsx';
import { LiveSystemProvider } from '../hooks/use-live-system.tsx';
import { LiveSystemModelClass } from '../models/live-system.ts';

function TestEditTool(): JSX.Element {
  const model = useModel(() => new LiveSystemModelClass(baseSystem));

  return (
    <LiveSystemProvider model={model}>
      <EditTool />
    </LiveSystemProvider>
  );
}

describe('EditTool', () => {
  it('shows the base system in the editor after mount', () => {
    const { container } = render(<TestEditTool />);

    const code = container.querySelector('code')!;
    expect(code.textContent).toContain('Starter System, natural numbers');
  });
});
