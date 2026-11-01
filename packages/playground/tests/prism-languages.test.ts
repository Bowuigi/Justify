import * as Prism from 'prismjs';
// Ensure all required grammars are loaded before the test imports
// @ts-expect-error 2882
import 'prismjs/components/prism-yaml';
// @ts-expect-error 2882
import 'prismjs/components/prism-markup';
// @ts-expect-error 2882
import 'prismjs/components/prism-markdown';

// Import the playground module that registers the custom languages
import '../lib/prism-languages.ts';

import { describe, it, expect } from 'vitest';

describe('Prism jtf-syntax language', () => {
  it('uses YAML grammar and returns key/value tokens', () => {
    const yamlSample = `desc: Natural number
suggest: [n, m, k]
grammar:
  - name: zero
    desc: Number zero
    is: '0'
  - name: succ
    desc: Successor function
    is: S n
    where:
      n: number`;

    const highlighted = Prism.highlight(yamlSample, Prism.languages['jtf-syntax']!, 'jtf-syntax');

    expect(highlighted).toContain('token key');
    expect(highlighted).toContain('token string');
    expect(highlighted).toContain('token punctuation');
  });
});

describe('Prism jtf-relation language', () => {
  it('uses YAML grammar and returns key/value tokens', () => {
    const yamlSample = `desc: "Natural number $n$ plus $m$ is syntactically equal to $k"
is: n + m = k
where:
  n: number
  m: number
  k: number`;

    const highlighted = Prism.highlight(
      yamlSample,
      Prism.languages['jtf-relation']!,
      'jtf-relation',
    );

    expect(highlighted).toContain('token key');
    expect(highlighted).toContain('token string');
    expect(highlighted).toContain('token punctuation');
  });
});

describe('Prism jtf-rule language', () => {
  it('highlights inference rule divider', () => {
    const ruleSample = `----------------------- [Ind] ind`;

    const highlighted = Prism.highlight(ruleSample, Prism.languages['jtf-rule']!, 'jtf-rule');

    expect(highlighted).toContain('token divider-group');
    expect(highlighted).toContain('token punctuation');
    expect(highlighted).toContain('token important');
    expect(highlighted).toContain('token comment');
  });

  it('highlights identifier maps', () => {
    const ruleSample = `? x, y as y, z
% a, b`;

    const highlighted = Prism.highlight(ruleSample, Prism.languages['jtf-rule']!, 'jtf-rule');

    expect(highlighted).toContain('token identifier-map');
    expect(highlighted).toContain('token builtin');
    expect(highlighted).toContain('token punctuation');
    expect(highlighted).toContain('token keyword');
  });

  it('highlights relation calls and constructors', () => {
    const ruleSample = `add x y z
add x (succ y) (succ z)`;

    const highlighted = Prism.highlight(ruleSample, Prism.languages['jtf-rule']!, 'jtf-rule');

    expect(highlighted).toContain('token relation-call');
    expect(highlighted).toContain('token function');
    expect(highlighted).toContain('token operator');
    expect(highlighted).toContain('token punctuation');
  });
});

describe('Prism Markdown with jtf-rule fenced blocks', () => {
  it('highlights fenced jtf-rule blocks with jtf-rule grammar', () => {
    const markdownSample = `# Test

\`\`\`jtf-rule
? x

-------------- [Base] base
add x (zero) x
\`\`\``;

    const highlighted = Prism.highlight(markdownSample, Prism.languages.markdown!, 'markdown');

    expect(highlighted).toContain('language-jtf-rule');
    expect(highlighted).toContain('token identifier-map');
    expect(highlighted).toContain('token divider-group');
    expect(highlighted).toContain('token relation-call');
  });
});
