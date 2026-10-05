import { load as loadYAML } from 'js-yaml';

import { validate as validateMetadata } from './codegen/metadata-validator.ts';
import { validate as validateRelationMeta } from './codegen/relation-meta-validator.ts';
import { parse as parseRelationRule, SyntaxError } from './codegen/rule-parser.js';
import { validate as validateSyntax } from './codegen/syntax-validator.ts';
import type { Metadata, RelationMeta, RelationRule, Syntax } from './codegen/types.d.ts';
import type { Extension } from './mod.ts';

export const metadataExtension: Extension = {
  handledLanguages: ['metadata'],
  call(input) {
    if (input.scope.length > 0) {
      return [
        {
          type: 'error',
          message: `This code block is misplaced. It should be at the top level, but was found in '${input.scope.join(' > ')}'`,
        },
      ];
    }

    let doc: unknown;
    try {
      doc = loadYAML(input.contents);
    } catch (error: unknown) {
      return [{ type: 'error', message: String(error) }];
    }

    const validated = validateMetadata(doc);
    if (!validated.success) {
      return validated.errors.map(err => ({
        type: 'error',
        message:
          err.suggestions.length === 0
            ? `Error: ${err.message}\nIn /${err.path.join('/')}`
            : `Error: ${err.message}\nIn /${err.path.join('/')}\nAllowed options: ${err.suggestions.join(', ')}`,
      }));
    }

    return [{ type: 'metadata', ...(doc as Metadata) }];
  },
};

export const relationMetaExtension: Extension = {
  handledLanguages: ['relation'],
  call(input) {
    if (input.scope.length !== 2 || input.scope[0] !== 'relations') {
      return [
        {
          type: 'error',
          message: `This code block is misplaced. It should be in 'Relations > [relation name]', but was found in '${input.scope.join(' > ')}'`,
        },
      ];
    }

    let doc: unknown;
    try {
      doc = loadYAML(input.contents);
    } catch (error: unknown) {
      return [{ type: 'error', message: String(error) }];
    }

    const validated = validateRelationMeta(doc);
    if (!validated.success) {
      return validated.errors.map(err => ({
        type: 'error',
        message: `Error: ${err.message}\nIn /${err.path.join('/')}`,
      }));
    }

    return [{ type: 'relation_meta', name: input.scope[1]!, ...(doc as RelationMeta) }];
  },
};

export const syntaxExtension: Extension = {
  handledLanguages: ['syntax'],
  call(input) {
    if (input.scope.length !== 2 || input.scope[0] !== 'syntax') {
      return [
        {
          type: 'error',
          message: `This code block is misplaced. It should be in 'Syntax > [syntax category]', but was found in '${input.scope.join(' > ')}'`,
        },
      ];
    }

    let doc: unknown;
    try {
      doc = loadYAML(input.contents);
    } catch (error: unknown) {
      return [{ type: 'error', message: String(error) }];
    }

    const validated = validateSyntax(doc);
    if (!validated.success) {
      return validated.errors.map(err => ({
        type: 'error',
        message: `Error: ${err.message}\nIn /${err.path.join('/')}`,
      }));
    }

    return [{ type: 'syntax', name: input.scope[1]!, ...(doc as Syntax) }];
  },
};

export const relationRuleExtension: Extension = {
  handledLanguages: ['rule'],
  call(input) {
    if (input.scope.length !== 2 || input.scope[0] !== 'relations') {
      return [
        {
          type: 'error',
          message: `This code block is misplaced. It should be in 'Relations > [relation name]', but was found in '${input.scope.join(' > ')}'`,
        },
      ];
    }

    let result: RelationRule;
    try {
      result = parseRelationRule(input.contents, { grammarSource: '<code block>' });
    } catch (error) {
      if (error instanceof SyntaxError) {
        return [
          {
            type: 'error',
            message: error.format([{ source: '<code block>', text: input.contents }]),
          },
        ];
      }
      return [
        {
          type: 'error',
          message: `Unhandled parsing error: ${error}`,
        },
      ];
    }

    return [{ type: 'relation_rule', relation: input.scope[1]!, ...result }];
  },
};
