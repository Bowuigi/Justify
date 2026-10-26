import { type Model, useModel } from '@preact/signals';
import { render, renderHook, screen } from '@testing-library/preact';
import type { JSX } from 'preact/jsx-runtime';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import baseSystem from '../base-system.jtf.md?raw';
import { ToolGuard } from '../components/tool-guard.tsx';
import { LiveSystemProvider } from '../hooks/use-live-system.tsx';
import { LiveSystemModelClass, type LiveSystemModel } from '../models/live-system.ts';

function create(initial: string): Model<LiveSystemModel> {
  const { result } = renderHook(() => useModel(() => new LiveSystemModelClass(initial)));
  return result.current;
}

function Guarded({ model }: { model: LiveSystemModel }): JSX.Element {
  return (
    <LiveSystemProvider model={model}>
      <ToolGuard>
        <p data-testid="tool-content">Tool content</p>
      </ToolGuard>
    </LiveSystemProvider>
  );
}

beforeEach(() => {
  vi.useFakeTimers();
});

describe('ToolGuard', () => {
  it('shows the fallback message when no verified system exists', () => {
    const live = create('   \n');
    render(<Guarded model={live} />);

    expect(
      screen.getByText('Fix the validation errors first. Open the Validate tool.'),
    ).not.toBeNull();
    expect(screen.queryByTestId('tool-content')).toBeNull();
  });

  it('shows the tool children when a verified system exists', () => {
    const live = create(baseSystem);
    render(<Guarded model={live} />);

    expect(screen.getByTestId('tool-content')).not.toBeNull();
    expect(
      screen.queryByText('Fix the validation errors first. Open the Validate tool.'),
    ).toBeNull();
  });

  it('shows both children and the Stale badge when the system is stale', () => {
    const live = create(baseSystem);
    live.editorBuffer.value = baseSystem.replace('add x y z', 'add x y z w');
    render(<Guarded model={live} />);

    expect(screen.getByTestId('tool-content')).not.toBeNull();
    expect(screen.getByText('Stale')).not.toBeNull();
    expect(screen.getByText('Stale').classList.contains('badge-warning')).toBe(true);
  });

  it('does not show the Stale badge when the system is current', () => {
    const live = create(baseSystem);
    render(<Guarded model={live} />);

    expect(screen.getByTestId('tool-content')).not.toBeNull();
    expect(screen.queryByText('Stale')).toBeNull();
  });
});
