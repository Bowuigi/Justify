import type * as Inferencer from '@justify/inferencer';
import { useModel } from '@preact/signals';
import { act, fireEvent, render, renderHook, screen } from '@testing-library/preact';
import type { JSX } from 'preact/jsx-runtime';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import baseSystem from '../base-system.jtf.md?raw';
import { TryTool } from '../components/try-tool.tsx';
import { LiveSystemProvider } from '../hooks/use-live-system.tsx';
import { LiveSystemModelClass, type LiveSystemModel } from '../models/live-system.ts';

const performed = vi.hoisted(() => ({ performQuery: vi.fn() }));

vi.mock('@justify/inferencer', async importOriginal => {
  const actual = await importOriginal<typeof Inferencer>();
  return {
    ...actual,
    performQuery: performed.performQuery,
  };
});

function create(source: string = baseSystem): LiveSystemModel {
  const { result } = renderHook(() => useModel(() => new LiveSystemModelClass(source)));
  return result.current;
}

function Tool({ model }: { model: LiveSystemModel }): JSX.Element {
  return (
    <LiveSystemProvider model={model}>
      <TryTool />
    </LiveSystemProvider>
  );
}

function mount(source: string = baseSystem): {
  model: LiveSystemModel;
  container: Element;
} {
  const model = create(source);
  const { container } = render(<Tool model={model} />);
  return { model, container };
}

const validQuery = {
  variables: { x: 'x', y: 'y', z: 'z' },
  literals: {},
  max_results: 1,
  relation: 'add',
  args: [
    { is: 'ref', to: 'x' },
    { is: 'ref', to: 'y' },
    { is: 'ref', to: 'z' },
  ],
};

const validQueryText = JSON.stringify(validQuery);
const validQueryText2 = JSON.stringify({ ...validQuery, max_results: 0 });

const zeroCon = { is: 'con', from: 'number', tag: 'zero', args: [] };

const solutionWithBinding = {
  variables: { x: zeroCon },
  derivation: undefined,
};

beforeEach(() => {
  vi.useFakeTimers();
  performed.performQuery.mockReset();
  performed.performQuery.mockReturnValue([solutionWithBinding]);
});

afterEach(() => {
  vi.useRealTimers();
});

function typeQuery(container: Element, text: string): void {
  fireEvent.input(container.querySelector<HTMLTextAreaElement>('textarea')!, {
    target: { value: text },
  });
}

describe('TryTool empty state', () => {
  it('shows a prompt and no result when the textarea is empty', () => {
    mount();

    expect(screen.getByText(/Enter a Query to get started/)).not.toBeNull();
    expect(screen.queryByText('Previous result')).toBeNull();
  });

  it('the Clear button empties the textarea, diagnostics, and result', () => {
    const { container } = mount();
    typeQuery(container, validQueryText);
    expect(screen.getByRole('button', { name: /Clear/i })).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Clear/i }));

    expect(container.querySelector<HTMLTextAreaElement>('textarea')!.value).toBe('');
    expect(screen.getByText(/Enter a Query to get started/)).not.toBeNull();
  });
});

describe('TryTool validation', () => {
  it('produces a diagnostic for malformed JSON and never calls the inferencer', () => {
    const { container } = mount();
    typeQuery(container, '{ not json');

    expect(screen.getByText(/JSON parsing/i)).not.toBeNull();
    expect(performed.performQuery).not.toHaveBeenCalled();
    expect(screen.queryByText('Previous result')).toBeNull();
  });

  it('produces diagnostics for a semantically invalid query and never calls the inferencer', () => {
    const { container } = mount();
    const bad = { ...validQuery, relation: 'no_such_relation' };
    typeQuery(container, JSON.stringify(bad));

    expect(screen.getByText(/Validator/i)).not.toBeNull();
    expect(performed.performQuery).not.toHaveBeenCalled();
  });

  it('calls performQuery with the parsed query and latest verified system for a valid query', () => {
    const { container } = mount();
    typeQuery(container, validQueryText);

    expect(performed.performQuery).toHaveBeenCalledTimes(1);
    expect(performed.performQuery).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'Starter System, natural numbers' }),
      validQuery,
    );
  });
});

describe('TryTool results display', () => {
  it('shows every solution in inferencer order', () => {
    const { container } = mount();
    performed.performQuery.mockReturnValue([
      { variables: { x: zeroCon }, derivation: undefined },
      { variables: { x: zeroCon }, derivation: undefined },
    ]);
    typeQuery(container, validQueryText);

    const solutions = container.querySelectorAll('[data-testid="try-solution"]');
    expect(solutions).toHaveLength(2);
  });

  it('shows bindings before the derivation tree', () => {
    const derivation = {
      relation: 'add',
      rule: 'base',
      args: [zeroCon, zeroCon, zeroCon],
      premises: [],
    };
    performed.performQuery.mockReturnValue([{ variables: { x: zeroCon }, derivation }]);
    const { container } = mount();
    typeQuery(container, validQueryText);

    const solution = container.querySelector('[data-testid="try-solution"]')!;
    const text = solution.textContent;
    expect(text.indexOf('Bindings')).toBeLessThan(text.indexOf('Derivation'));
    expect(container.querySelector('.katex-error')).toBeNull();
  });

  it('omits the bindings section when a solution has no variables', () => {
    performed.performQuery.mockReturnValue([{ variables: {}, derivation: undefined }]);
    const { container } = mount();
    typeQuery(container, validQueryText);

    const solution = container.querySelector('[data-testid="try-solution"]')!;
    expect(solution.textContent).not.toContain('Bindings');
  });
});

describe('TryTool results states', () => {
  it('shows a no-solutions message and replaces the old result', () => {
    const { container } = mount();
    performed.performQuery.mockReturnValue([solutionWithBinding]);
    typeQuery(container, validQueryText);
    expect(container.querySelectorAll('[data-testid="try-solution"]')).toHaveLength(1);

    performed.performQuery.mockReturnValue([]);
    typeQuery(container, validQueryText2);

    expect(container.querySelectorAll('[data-testid="try-solution"]')).toHaveLength(0);
    expect(screen.getByText(/No solutions/i)).not.toBeNull();
  });

  it('keeps the last successful result and shows Previous result for an invalid query', () => {
    const { container } = mount();
    performed.performQuery.mockReturnValue([solutionWithBinding]);
    typeQuery(container, validQueryText);
    expect(container.querySelectorAll('[data-testid="try-solution"]')).toHaveLength(1);

    const bad = { ...validQuery, relation: 'no_such_relation' };
    typeQuery(container, JSON.stringify(bad));

    expect(screen.getByText('Previous result')).not.toBeNull();
    expect(container.querySelectorAll('[data-testid="try-solution"]')).toHaveLength(1);
    expect(performed.performQuery).toHaveBeenCalledTimes(1);
  });
});

describe('TryTool result labels', () => {
  it('does not show the Previous result label after a successful result', () => {
    const { container } = mount();
    performed.performQuery.mockReturnValue([solutionWithBinding]);
    typeQuery(container, validQueryText);

    expect(screen.queryByText('Previous result')).toBeNull();
    expect(container.querySelectorAll('[data-testid="try-solution"]')).toHaveLength(1);
  });

  it('shows plain red fatal text and keeps the last successful result', () => {
    const { container } = mount();
    performed.performQuery.mockReturnValue([solutionWithBinding]);
    typeQuery(container, validQueryText);
    expect(container.querySelectorAll('[data-testid="try-solution"]')).toHaveLength(1);

    performed.performQuery.mockReturnValue('Fatal error on execution (Error): boom');
    typeQuery(container, validQueryText2);

    expect(screen.getByText(/boom/i)).not.toBeNull();
    expect(screen.getByText(/boom/i).closest('.bg-error')).not.toBeNull();
    expect(container.querySelectorAll('[data-testid="try-solution"]')).toHaveLength(1);
  });
});

describe('TryTool system changes', () => {
  it('re-runs the current query against a newly verified system', async () => {
    const { model, container } = mount();
    performed.performQuery.mockReturnValue([solutionWithBinding]);
    typeQuery(container, validQueryText);
    expect(performed.performQuery).toHaveBeenCalledTimes(1);

    const updated = baseSystem.replace('Starter System, natural numbers', 'Changed System');
    await act(() => {
      model.editorBuffer.value = updated;
    });
    await act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(performed.performQuery).toHaveBeenCalledTimes(2);
  });
});
