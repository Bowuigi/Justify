import type { System } from '@justify/core';
import { useModel } from '@preact/signals';
import { render } from '@testing-library/preact';
import type { JSX } from 'preact/jsx-runtime';
import { describe, expect, it } from 'vitest';

import baseSystem from '../base-system.jtf.md?raw';
import { TexBlock } from '../components/tex-block.tsx';
import { LiveSystemProvider } from '../hooks/use-live-system.tsx';
import { humanizeIdentifier, previewSections } from '../lib/preview.ts';
import { LiveSystemModelClass } from '../models/live-system.ts';

function rule(id: string): System['relations'][string]['rules'][number] {
  return {
    literals: {},
    patterns: {},
    premises: [],
    rule: { id, tex: id },
    variables: {},
  };
}

const testSystem: System = {
  description: 'Starter System, natural numbers',
  relations: {
    add: {
      arguments: [],
      description: 'Add',
      fixity: 'none',
      rules: [rule('base'), rule('ind')],
      tex_parts: [],
    },
    leq: {
      arguments: [],
      description: 'Less or equal',
      fixity: 'none',
      rules: [],
      tex_parts: [],
    },
  },
  syntax: {},
};

describe('humanizeIdentifier', () => {
  it('capitalizes a single word', () => {
    expect(humanizeIdentifier('add')).toBe('Add');
  });

  it('splits snake_case words and capitalizes each word', () => {
    expect(humanizeIdentifier('judge_member')).toBe('Judge Member');
  });

  it('keeps digits in an identifier', () => {
    expect(humanizeIdentifier('add2')).toBe('Add2');
    expect(humanizeIdentifier('step_2')).toBe('Step 2');
  });
});

describe('previewSections', () => {
  it('returns Description and Grammar expressions for the base system', () => {
    const sections = previewSections(testSystem);
    expect(sections.description).toBe(String.raw`\jyDescription`);
    expect(sections.grammar).toBe(String.raw`\jyGrammar`);
  });

  it('returns relations in System insertion order', () => {
    const sections = previewSections(testSystem);
    expect(sections.relations.map(relation => relation.id)).toEqual(['add', 'leq']);
  });

  it('builds the add relation header and rules with commandOf', () => {
    const sections = previewSections(testSystem);
    const add = sections.relations[0]!;
    expect(add.header).toBe(String.raw`\jrdAdd`);
    expect(add.rules).toBe(String.raw`\jrrsAdd`);
  });

  it('marks a relation without rules as hasRules false', () => {
    const sections = previewSections(testSystem);
    expect(sections.relations[0]!.hasRules).toBe(true);
    expect(sections.relations[1]!.hasRules).toBe(false);
  });
});

function TestTexBlock({ expression }: { expression: string }): JSX.Element {
  const model = useModel(() => new LiveSystemModelClass(baseSystem));

  return (
    <LiveSystemProvider model={model}>
      <TexBlock expression={expression} />
    </LiveSystemProvider>
  );
}

describe('TexBlock', () => {
  it('renders a .katex element', () => {
    const { container } = render(<TestTexBlock expression={String.raw`\jrrsAdd`} />);
    expect(container.querySelector('.katex')).not.toBeNull();
  });

  it('renders no .katex-error element', () => {
    const { container } = render(<TestTexBlock expression={String.raw`\jrrsAdd`} />);
    expect(container.querySelector('.katex-error')).toBeNull();
  });
});
