import { useModel } from '@preact/signals';
import { act, render, renderHook } from '@testing-library/preact';
import type { JSX } from 'preact';
import { describe, it, expect } from 'vitest';

import baseSystem from '../base-system.jtf.md?raw';
import { EditTool } from '../components/edit-tool.tsx';
import { LiveSystemProvider } from '../hooks/use-live-system.tsx';
import { type LiveSystemModel, LiveSystemModelClass } from '../models/live-system.ts';

function TestEditTool(): JSX.Element {
  const model = useModel(() => new LiveSystemModelClass(baseSystem));

  return (
    <LiveSystemProvider model={model}>
      <EditTool />
    </LiveSystemProvider>
  );
}

function TestControlledEditTool({ model }: { model: LiveSystemModel }): JSX.Element {
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

  it('updates the editor when the buffer changes outside the editor', async () => {
    const { result } = renderHook(() => useModel(() => new LiveSystemModelClass(baseSystem)));
    const { container } = render(<TestControlledEditTool model={result.current} />);

    await act(() => {
      result.current.editorBuffer.value = baseSystem.replace(
        'Starter System, natural numbers',
        'Outside edit',
      );
    });

    expect(container.querySelector('code')!.textContent).toContain('Outside edit');
  });
});
