// oxlint-disable no-useless-escape

import * as Prism from 'prismjs';
// Ensure base grammars are loaded
// @ts-expect-error 2882
import 'prismjs/components/prism-yaml';
// @ts-expect-error 2882
import 'prismjs/components/prism-markup';
// @ts-expect-error 2882
import 'prismjs/components/prism-markdown';

// Both of those are just YAML
Prism.languages['jtf-syntax'] = Prism.languages.yaml!;
Prism.languages['jtf-relation'] = Prism.languages.yaml!;

/**
 * Custom Prism grammar for jtf-rule language. Based on the rule grammar in
 * packages/markdown-dsl/formats/rule.peggyjs
 */
Prism.languages['jtf-rule'] = {
  // Divider line: ------- [Annotation] identifier
  'divider-group': {
    pattern: /^[-]{3,}\s+\[[^\]]+\]\s+[a-z][a-z0-9_]*$/m,
    inside: {
      punctuation: /\-+/,
      important: {
        pattern: /\[[^\]]+\]/,
      },
      comment: /[a-z][a-z0-9_]*$/,
    },
  },

  'identifier-map': {
    pattern: /^[\?%] .*$/m,
    inside: {
      builtin: /^[\?%]/m,
      punctuation: /,/,
      keyword: /\bas\b/,
    },
  },

  'relation-call': {
    pattern: /^[a-z][a-z0-9_]* .*$/m,
    inside: {
      function: /^[a-z][a-z0-9_]*/m,
      operator: /(?<=\()[a-z][a-z0-9_]*/,
      punctuation: /[\(\)]/,
    },
  },
};
