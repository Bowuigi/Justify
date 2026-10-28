import type { Derivation, DerivationTerm, System } from '@justify/core';
import { describe, expect, it } from 'vitest';

import {
  commandOf,
  extractDerivationTeX,
  extractDerivationTermTeX,
  extractTeX,
  type TeXScope,
} from '../lib.ts';

const system: System = {
  description: 'Test System',
  syntax: {
    number: {
      description: 'Natural number',
      suggestions: [],
      grammar: [
        {
          id: 'zero',
          description: 'Zero',
          tex_parts: ['0'],
          fixity: 'none',
          arguments: [],
        },
        {
          id: 'succ',
          description: 'Successor',
          tex_parts: ['S'],
          fixity: 'prefix',
          arguments: [{ from: 'number', id: 'n', tex: 'n' }],
        },
      ],
    },
  },
  relations: {
    judge: {
      description: 'Judgement',
      tex_parts: ['J'],
      fixity: 'none',
      arguments: [{ from: 'number', id: 'x', tex: 'x' }],
      rules: [
        {
          rule: { id: 'base', tex: 'Base' },
          variables: {},
          literals: {},
          patterns: { x: { is: 'con', from: 'number', tag: 'zero', args: [] } },
          premises: [],
        },
        {
          rule: { id: 'step', tex: 'Step' },
          variables: { n: 'n' },
          literals: {},
          patterns: { x: { is: 'con', from: 'number', tag: 'succ', args: [] } },
          premises: [
            { relation: 'judge', args: [] },
            { relation: 'judge', args: [] },
          ],
        },
      ],
    },
  },
};

const queryScope: TeXScope = { variables: { p: 'p', q: 'q' }, literals: {} };
const emptyScope: TeXScope = { variables: {}, literals: {} };
const literalScope: TeXScope = { variables: {}, literals: { zero: '0' } };
const ruleScope: TeXScope = { variables: { n: 'n' }, literals: {} };

const gZero = commandOf('grammar', 'number_zero', []);
const gSucc = (arg: string): string => commandOf('grammar', 'number_succ', [arg]);
const rJudge = (arg: string): string => commandOf('relation', 'judge', [arg]);
const jyTree = (rule: string, premises: string, conclusion: string): string =>
  commandOf('system', 'tree', [rule, premises, conclusion]);

const zeroCon: DerivationTerm = { is: 'con', from: 'number', tag: 'zero', args: [] };

function succCon(arg: DerivationTerm): DerivationTerm {
  return { is: 'con', from: 'number', tag: 'succ', args: [arg] };
}

function leafDerivation(arg: DerivationTerm, rule = 'base'): Derivation {
  return { relation: 'judge', rule, args: [arg], premises: [] };
}

describe('extractTeX', () => {
  it(String.raw`defines the \jyTree macro and retains \jyInfer`, () => {
    const output = extractTeX(system);
    expect(output).toContain(String.raw`\newcommand{\jyTree}`);
    expect(output).toContain(String.raw`\newcommand{\jyInfer}`);
  });
});

describe('extractDerivationTermTeX', () => {
  it('renders a constructor using the System grammar command for its category and tag', () => {
    const term = succCon(zeroCon);
    expect(extractDerivationTermTeX(term, queryScope)).toBe(gSucc(gZero));
  });

  it('renders a root variable with the Query mapping and a counter superscript', () => {
    const term: DerivationTerm = { is: 'var', id: 'p', counter: 5 };
    expect(extractDerivationTermTeX(term, queryScope)).toBe(String.raw`p^{5}`);
  });

  it('renders a nested variable with the selected rule mapping and a counter superscript', () => {
    const term: DerivationTerm = { is: 'var', id: 'n', counter: 3 };
    expect(extractDerivationTermTeX(term, ruleScope)).toBe(String.raw`n^{3}`);
  });

  it('falls back to the identifier for an unmapped variable and still renders the counter', () => {
    const term: DerivationTerm = { is: 'var', id: 'y', counter: 2 };
    expect(extractDerivationTermTeX(term, emptyScope)).toBe(String.raw`y^{2}`);
  });

  it('renders a mapped literal with its scope mapping', () => {
    const term: DerivationTerm = { is: 'lit', id: 'zero' };
    expect(extractDerivationTermTeX(term, literalScope)).toBe('0');
  });

  it('falls back to the identifier for an unmapped literal', () => {
    const term: DerivationTerm = { is: 'lit', id: 'one' };
    expect(extractDerivationTermTeX(term, emptyScope)).toBe('one');
  });
});

describe('extractDerivationTeX', () => {
  it('uses an empty premise argument and the rule tex for a leaf node', () => {
    const derivation = leafDerivation(zeroCon);
    expect(extractDerivationTeX(system, derivation, queryScope)).toBe(
      jyTree('Base', '', rJudge(gZero)),
    );
  });
  it('separates immediate premises side by side in a multi-premise tree', () => {
    const premise = leafDerivation(zeroCon);
    const derivation: Derivation = {
      relation: 'judge',
      rule: 'step',
      args: [zeroCon],
      premises: [premise, premise],
    };
    const premiseTeX = jyTree('Base', '', rJudge(gZero));
    const separator = String.raw` \qquad `;
    const premises = `${premiseTeX}${separator}${premiseTeX}`;
    expect(extractDerivationTeX(system, derivation, queryScope)).toBe(
      jyTree('Step', premises, rJudge(gZero)),
    );
  });
  it('places nested premise trees inside their parent premise argument', () => {
    const inner = leafDerivation(zeroCon);
    const middle: Derivation = {
      relation: 'judge',
      rule: 'step',
      args: [zeroCon],
      premises: [inner],
    };
    const derivation: Derivation = {
      relation: 'judge',
      rule: 'step',
      args: [zeroCon],
      premises: [middle],
    };
    const innerTeX = jyTree('Base', '', rJudge(gZero));
    const middleTeX = jyTree('Step', innerTeX, rJudge(gZero));
    expect(extractDerivationTeX(system, derivation, queryScope)).toBe(
      jyTree('Step', middleTeX, rJudge(gZero)),
    );
  });
  it('renders a conclusion using the System relation command for its relation', () => {
    const derivation = leafDerivation(succCon(zeroCon));
    expect(extractDerivationTeX(system, derivation, queryScope)).toBe(
      jyTree('Base', '', rJudge(gSucc(gZero))),
    );
  });
});

describe('extractDerivationTeX scopes', () => {
  it('renders a root variable using the Query mapping and its counter as a superscript', () => {
    const derivation = leafDerivation({ is: 'var', id: 'p', counter: 7 });
    expect(extractDerivationTeX(system, derivation, queryScope)).toBe(
      jyTree('Base', '', rJudge(String.raw`p^{7}`)),
    );
  });

  it('renders a nested variable using the selected rule mapping and its counter as a superscript', () => {
    const derivation = leafDerivation({ is: 'var', id: 'n', counter: 3 });
    expect(extractDerivationTeX(system, derivation, ruleScope)).toBe(
      jyTree('Base', '', rJudge(String.raw`n^{3}`)),
    );
  });

  it('uses the selected rule scope for nested premise nodes', () => {
    const premise: Derivation = {
      relation: 'judge',
      rule: 'base',
      args: [{ is: 'var', id: 'n', counter: 1 }],
      premises: [],
    };
    const derivation: Derivation = {
      relation: 'judge',
      rule: 'step',
      args: [zeroCon],
      premises: [premise],
    };
    const premiseTeX = jyTree('Base', '', rJudge(String.raw`n^{1}`));
    expect(extractDerivationTeX(system, derivation, queryScope)).toBe(
      jyTree('Step', premiseTeX, rJudge(gZero)),
    );
  });
});
