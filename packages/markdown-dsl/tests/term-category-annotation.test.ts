import type { System, Term } from '@justify/core';
import { validateSystem } from '@justify/validator';
import { describe, expect, it } from 'vitest';

import {
  metadataExtension,
  relationMetaExtension,
  relationRuleExtension,
  syntaxExtension,
} from '../extensions.ts';
import { runPipeline, type Extension } from '../mod.ts';

const extensions: Array<Extension> = [
  metadataExtension,
  syntaxExtension,
  relationMetaExtension,
  relationRuleExtension,
];

const BASE_SAMPLE = String.raw`---
description: Test system
---

# Syntax

## Term

~~~jtf-syntax
desc: Term
suggest: [e]
grammar:
  - name: lambda
    desc: Lambda
    is: '( x : t )\Rightarrow e'
    where:
      x: literal
      t: type
      e: term
  - name: var
    desc: Variable
    is: x
    where:
      x: literal
~~~

## Type

~~~jtf-syntax
desc: Type
suggest: [t]
grammar:
  - name: arrow
    desc: Arrow
    is: '( t_1 )\Rightarrow t_2'
    where:
      t_1: type
      t_2: type
~~~

# Relations

## Eval

~~~jtf-relation
desc: Eval
is: e_1 \Rightarrow e_2
where:
  e_1: term
  e_2: term
~~~

~~~jtf-rule
? x, t, e, e_1, e_2
prim_neq e_1 __PRIM_NEQ_ARGUMENT__
------------------- [Test] test
eval e_1 e_2
~~~
`;

const OUTSIDE_SAMPLE = String.raw`---
description: Test system
---

# Syntax

## Term

~~~jtf-syntax
desc: Term
suggest: [e]
grammar:
  - name: var
    desc: Variable
    is: x
    where:
      x: literal
~~~

## Type

~~~jtf-syntax
desc: Type
suggest: [t]
grammar:
  - name: arrow
    desc: Arrow
    is: '( t_1 )\Rightarrow t_2'
    where:
      t_1: type
      t_2: type
~~~

# Relations

## Eval

~~~jtf-relation
desc: Eval
is: e_1 \Rightarrow e_2
where:
  e_1: term
  e_2: term
~~~

~~~jtf-rule
? x, t, e_2
------------------- [Test] test
eval __CONCLUSION_TERM__ e_2
~~~
`;

function sample(primNeqArgument: string): string {
  return BASE_SAMPLE.replace('__PRIM_NEQ_ARGUMENT__', primNeqArgument);
}

function outsideSample(conclusionTerm: string): string {
  return OUTSIDE_SAMPLE.replace('__CONCLUSION_TERM__', conclusionTerm);
}

function extract(markdown: string): ReturnType<typeof runPipeline> {
  return runPipeline(markdown, '<test>', extensions);
}

function primNeqTerm(system: System): Term {
  const premise = system.relations.eval?.rules[0]?.premises[0];
  const term = premise?.args[1];
  if (term === undefined) {
    throw new Error('Expected a prim_neq premise argument');
  }
  return term;
}

function patternFrom(system: System): string {
  const pattern = system.relations.eval?.rules[0]?.patterns.e_1;
  if (pattern?.is !== 'con') {
    throw new Error('Expected a constructor pattern');
  }
  return pattern.from;
}

describe('term syntax category annotations', () => {
  it('uses the explicit category of a prim_neq constructor', () => {
    const { extracted, diagnostics } = extract(sample('(term/lambda x t e)'));

    expect(diagnostics).toEqual([]);
    expect(primNeqTerm(extracted)).toEqual({
      is: 'con',
      from: 'term',
      tag: 'lambda',
      args: [
        { is: 'ref', to: 'x' },
        { is: 'ref', to: 't' },
        { is: 'ref', to: 'e' },
      ],
    });
    expect(validateSystem(extracted, '<test>')).toEqual([]);
  });

  it('emits <unknown> for an unannotated prim_neq constructor', () => {
    const { extracted, diagnostics } = extract(sample('(lambda x t e)'));

    expect(diagnostics).toEqual([]);
    expect(primNeqTerm(extracted)).toEqual({
      is: 'con',
      from: '<unknown>',
      tag: 'lambda',
      args: [
        { is: 'ref', to: 'x' },
        { is: 'ref', to: 't' },
        { is: 'ref', to: 'e' },
      ],
    });

    const codes = validateSystem(extracted, '<test>').map(diagnostic => diagnostic.code);
    expect(codes).toContain('VI-I');
    expect(codes).toContain('ODS-S');
  });

  it('honors annotations outside prim_neq', () => {
    const defined = extract(outsideSample('(type/arrow x t)'));
    expect(defined.diagnostics).toEqual([]);
    expect(patternFrom(defined.extracted)).toBe('type');
    expect(validateSystem(defined.extracted, '<test>')).toEqual([]);

    const undefinedCategory = extract(outsideSample('(missing/arrow x t)'));
    expect(undefinedCategory.diagnostics).toEqual([]);
    expect(patternFrom(undefinedCategory.extracted)).toBe('missing');
  });
});
