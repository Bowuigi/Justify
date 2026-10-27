import type { System } from '@justify/core';
import { describe, expect, it } from 'vitest';

import { commandOf, extractTeX, type TeXNamespace } from '../lib.ts';

const system: System = {
  description: 'Test System',
  relations: {
    add: {
      arguments: [],
      description: 'Description',
      fixity: 'none',
      rules: [],
      tex_parts: [],
    },
  },
  syntax: {},
};

describe('commandOf', () => {
  it('is exported from the package entry point', () => {
    expect(typeof commandOf).toBe('function');
  });

  it(String.raw`returns \jyGrammar for system grammar`, () => {
    expect(commandOf('system', 'grammar')).toBe(String.raw`\jyGrammar`);
  });

  it(String.raw`returns \jyDescription for system description`, () => {
    expect(commandOf('system', 'description')).toBe(String.raw`\jyDescription`);
  });

  it(String.raw`returns \jrdJudgeMember for relationDescription judge_member`, () => {
    expect(commandOf('relationDescription', 'judge_member')).toBe(String.raw`\jrdJudgeMember`);
  });

  it(String.raw`returns \jrrsAdd for relationRuleset add`, () => {
    expect(commandOf('relationRuleset', 'add')).toBe(String.raw`\jrrsAdd`);
  });

  it('renders arguments as consecutive brace groups', () => {
    expect(commandOf('system', 'infer', ['rule', 'premises', 'conclusion'])).toBe(
      String.raw`\jyInfer{rule}{premises}{conclusion}`,
    );
  });

  it('accepts every TeXNamespace value', () => {
    const namespaces: Record<TeXNamespace, true> = {
      system: true,
      grammar: true,
      relation: true,
      relationDescription: true,
      relationRule: true,
      relationRuleset: true,
    };
    for (const ns of Object.keys(namespaces)) {
      expect(() => commandOf(ns as TeXNamespace, 'x')).not.toThrow();
    }
  });
});

describe('extractTeX', () => {
  it(String.raw`still contains \newcommand{\jyGrammar}, \jrdAdd, and \jrrsAdd`, () => {
    const output = extractTeX(system);
    expect(output).toContain(String.raw`\newcommand{\jyGrammar}`);
    expect(output).toContain(String.raw`\jrdAdd`);
    expect(output).toContain(String.raw`\jrrsAdd`);
  });
});
