import type { System } from '@justify/core';
import { extractTeX } from '@justify/tex-extractor';
import { render } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';

import { TexBlock } from '../components/tex-block.tsx';
import { humanizeIdentifier, previewSections } from '../lib/preview.ts';

function rule(id: string): System['relations'][string]['rules'][number] {
  return {
    literals: {},
    patterns: {},
    premises: [],
    rule: { id, tex: id },
    variables: {},
  };
}

function makeSystem(): System {
  return {
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
}

const baseSystem = makeSystem();

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
    const sections = previewSections(baseSystem);
    expect(sections.description).toBe(String.raw`\jyDescription`);
    expect(sections.grammar).toBe(String.raw`\jyGrammar`);
  });

  it('returns relations in System insertion order', () => {
    const sections = previewSections(baseSystem);
    expect(sections.relations.map(relation => relation.id)).toEqual(['add', 'leq']);
  });

  it('builds the add relation header and rules with commandOf', () => {
    const sections = previewSections(baseSystem);
    const add = sections.relations[0]!;
    expect(add.header).toBe(String.raw`\jrdAdd`);
    expect(add.rules).toBe(String.raw`\jrrsAdd`);
  });

  it('marks a relation without rules as hasRules false', () => {
    const sections = previewSections(baseSystem);
    expect(sections.relations[0]!.hasRules).toBe(true);
    expect(sections.relations[1]!.hasRules).toBe(false);
  });
});

describe('TexBlock', () => {
  const preamble = extractTeX(baseSystem);

  it('renders a .katex element', () => {
    const { container } = render(
      <TexBlock preamble={preamble} expression={String.raw`\jrrsAdd`} />,
    );
    expect(container.querySelector('.katex')).not.toBeNull();
  });

  it('renders no .katex-error element', () => {
    const { container } = render(
      <TexBlock preamble={preamble} expression={String.raw`\jrrsAdd`} />,
    );
    expect(container.querySelector('.katex-error')).toBeNull();
  });
});
