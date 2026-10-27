import { type Model, useModel } from '@preact/signals';
import { act, render, renderHook, screen } from '@testing-library/preact';
import type { JSX } from 'preact/jsx-runtime';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import baseSystem from '../base-system.jtf.md?raw';
import { PreviewTool } from '../components/preview-tool.tsx';
import { LiveSystemProvider } from '../hooks/use-live-system.tsx';
import { LiveSystemModelClass, type LiveSystemModel } from '../models/live-system.ts';

const multiRelationSystem = `${baseSystem}
## test_ing
\`\`\`jtf-relation
desc: $x$ exists
is: 'x \\text{exists}'
where:
  x: number
\`\`\`
`;

const zeroRuleMarkdown = `---
description: Zero Rule System
---

# Syntax
## Unit

\`\`\`jtf-syntax
desc: Unit
suggest: [u]
grammar:
  - name: unit
    desc: One thing
    is: \\star
\`\`\`

# Relations
## test_ing

\`\`\`jtf-relation
desc: $x$ exists
is: 'x \\text{exists}'
where:
  x: unit
\`\`\`
`;

function create(source: string): Model<LiveSystemModel> {
  const { result } = renderHook(() => useModel(() => new LiveSystemModelClass(source)));
  return result.current;
}

function Tool({ model }: { model: LiveSystemModel }): JSX.Element {
  return (
    <LiveSystemProvider model={model}>
      <PreviewTool />
    </LiveSystemProvider>
  );
}

function mount(source: string): { live: Model<LiveSystemModel>; container: Element } {
  const live = create(source);
  const { container } = render(<Tool model={live} />);
  return { live, container };
}

beforeEach(() => {
  vi.useFakeTimers();
});

describe('PreviewTool base system', () => {
  it('renders headings', () => {
    mount(baseSystem);

    expect(screen.getByRole('heading', { level: 2, name: 'Description' })).not.toBeNull();
    expect(screen.getByRole('heading', { level: 2, name: 'Grammar' })).not.toBeNull();
    expect(screen.getByRole('heading', { level: 2, name: 'Relations' })).not.toBeNull();
    expect(screen.getByRole('heading', { level: 3, name: 'Add' })).not.toBeNull();
  });

  it('renders four .katex elements and no errors for the base system', () => {
    const { container } = mount(baseSystem);

    expect(container.querySelectorAll('.katex')).toHaveLength(4);
    expect(container.querySelector('.katex-error')).toBeNull();
  });

  it('gives every rules container the preview-rules class', () => {
    mount(baseSystem);

    const rules = screen.getByTestId('rules-add');
    expect(rules.classList.contains('preview-rules')).toBe(true);
  });
});

describe('PreviewTool relations', () => {
  it('renders relation sections in System insertion order', () => {
    mount(multiRelationSystem);

    const ids = screen.getAllByTestId(/^relation-/).map(element => element.dataset.testid!);
    expect(ids).toEqual(['relation-add', 'relation-test_ing']);
  });

  it('renders humanized relation titles', () => {
    mount(multiRelationSystem);

    expect(screen.getByRole('heading', { level: 3, name: 'Add' })).not.toBeNull();
    expect(screen.getByRole('heading', { level: 3, name: 'Test Ing' })).not.toBeNull();
  });

  it('renders a zero-rule relation header and No rules defined', () => {
    mount(zeroRuleMarkdown);

    expect(screen.getByRole('heading', { level: 3, name: 'Test Ing' })).not.toBeNull();
    expect(screen.getByText('No rules defined')).not.toBeNull();
    expect(screen.queryByTestId('rules-test_ing')).toBeNull();
  });
});

describe('PreviewTool staleness', () => {
  it('shows the Stale badge and keeps previous content after an editor change', async () => {
    const { live } = mount(baseSystem);

    expect(screen.getByRole('heading', { level: 3, name: 'Add' })).not.toBeNull();
    expect(screen.queryByText('Stale')).toBeNull();

    await act(() => {
      live.editorBuffer.value = baseSystem.replace('add x y z', 'changed');
    });

    expect(screen.getByText('Stale')).not.toBeNull();
    expect(screen.getByRole('heading', { level: 3, name: 'Add' })).not.toBeNull();
  });
});
