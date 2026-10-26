import type { Diagnostic } from '@justify/core';
import { type Model, useModel } from '@preact/signals';
import { render, renderHook, screen } from '@testing-library/preact';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import baseSystem from '../base-system.jtf.md?raw';
import { DiagnosticCard } from '../components/diagnostic-card.tsx';
import { LocationPath } from '../components/location-path.tsx';
import { RichText } from '../components/rich-text.tsx';
import { ValidateTool } from '../components/validate-tool.tsx';
import { LiveSystemProvider } from '../hooks/use-live-system.tsx';
import { type LiveSystemModel, LiveSystemModelClass } from '../models/live-system.ts';

function create(initial: string = baseSystem): Model<LiveSystemModel> {
  const { result } = renderHook(() => useModel(() => new LiveSystemModelClass(initial)));
  return result.current;
}

function advance(ms: number): void {
  vi.advanceTimersByTime(ms);
}

beforeEach(() => {
  vi.useFakeTimers();
});

function validatorDiagnostic(): Diagnostic {
  return {
    source: '<editor>',
    origin: 'validator',
    code: 'FAKE-CODE',
    message: ['Invalid relation ', { style: 'error', text: 'missing' }],
    hints: [['Did you mean:', { style: 'correct', text: 'add' }]],
    relatedLocations: [
      { label: 'In', location: { is: 'path', path: ['relations', 0] } },
      { label: 'Conflicts with', location: { is: 'line-span', start: 10, end: 12 } },
    ],
  };
}

function markdownDslDiagnostic(): Diagnostic {
  return {
    source: '<editor>',
    origin: 'markdown-dsl',
    message: ['Malformed YAML front matter'],
    hints: [],
    relatedLocations: [],
  };
}

describe('RichText', () => {
  it('shows plain string parts without extra styling', () => {
    const { container } = render(<RichText richText={['plain text']} />);
    const span = container.querySelector('span span')!;
    expect(span.textContent).toBe('plain text');
    expect(span.classList.contains('font-bold')).toBe(false);
  });

  it('shows correct parts with bold success styling', () => {
    render(<RichText richText={[{ style: 'correct', text: 'good' }]} />);
    const span = screen.getByText('good');
    expect(span.classList.contains('font-bold')).toBe(true);
    expect(span.classList.contains('text-success')).toBe(true);
  });

  it('shows error parts with bold error styling', () => {
    render(<RichText richText={[{ style: 'error', text: 'bad' }]} />);
    const span = screen.getByText('bad');
    expect(span.classList.contains('font-bold')).toBe(true);
    expect(span.classList.contains('text-error')).toBe(true);
  });
});

describe('LocationPath', () => {
  it('shows every segment in order', () => {
    const { container } = render(<LocationPath path={['relations', 0, 'name']} />);
    const items = container.querySelectorAll('li');
    expect(items).toHaveLength(3);
    expect(items[0]!.textContent).toBe('relations');
    expect(items[1]!.textContent).toBe('0');
    expect(items[2]!.textContent).toBe('name');
  });

  it('has no link destination', () => {
    const { container } = render(<LocationPath path={['relations', 0]} />);
    expect(container.querySelector('a')).toBeNull();
    expect(container.querySelector('[href]')).toBeNull();
  });
});

describe('DiagnosticCard', () => {
  it('shows its origin, message, hints, and related locations', () => {
    const diagnostic = validatorDiagnostic();
    render(<DiagnosticCard diagnostic={diagnostic} />);

    expect(screen.getByText('Validator')).not.toBeNull();
    expect(screen.getByText('Invalid relation')).not.toBeNull();
    expect(screen.getByText('missing')).not.toBeNull();
    expect(screen.getByText('Did you mean:')).not.toBeNull();
    expect(screen.getByText('add')).not.toBeNull();
    expect(screen.getByText('In:')).not.toBeNull();
    expect(screen.getByText('Conflicts with:')).not.toBeNull();
  });

  it('omits the validator error code', () => {
    render(<DiagnosticCard diagnostic={validatorDiagnostic()} />);
    expect(screen.queryByText('FAKE-CODE')).toBeNull();
  });

  it('uses the visual breadcrumb for a path location', () => {
    render(<DiagnosticCard diagnostic={validatorDiagnostic()} />);
    const breadcrumb = screen.getByText('relations');
    expect(breadcrumb.closest('.breadcrumbs')).not.toBeNull();
  });

  it('shows both line numbers for a line-span location', () => {
    render(<DiagnosticCard diagnostic={validatorDiagnostic()} />);
    expect(screen.getByText('10')).not.toBeNull();
    expect(screen.getByText('12')).not.toBeNull();
  });

  it('shows the Markdown DSL origin label', () => {
    render(<DiagnosticCard diagnostic={markdownDslDiagnostic()} />);
    expect(screen.getByText('Markdown DSL')).not.toBeNull();
  });
});

describe('ValidateTool', () => {
  it('shows All good! for a valid state', () => {
    const live = create();
    render(
      <LiveSystemProvider model={live}>
        <ValidateTool />
      </LiveSystemProvider>,
    );
    expect(screen.getByText('All good!')).not.toBeNull();
  });

  it('shows one card for every diagnostic in an invalid state', () => {
    const live = create();
    live.editorBuffer.value = baseSystem.replace('add x y z', 'missing x y z');
    advance(300);

    const state = live.state.value;
    expect(state.is).toBe('invalid');
    if (state.is !== 'invalid') return;
    expect(state.diagnostics.length).toBeGreaterThan(0);

    render(
      <LiveSystemProvider model={live}>
        <ValidateTool />
      </LiveSystemProvider>,
    );

    const cards = screen.getAllByRole('alert');
    expect(cards).toHaveLength(state.diagnostics.length);
    expect(cards.length).toBeGreaterThan(0);
  });
});
