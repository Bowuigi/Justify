import { load as loadYAML } from 'js-yaml';

import { validate as validateRelationMeta } from './codegen/relation-meta-validator.ts';
import { validate as validateSyntax } from './codegen/syntax-validator.ts';
import type { RelationMeta, Syntax } from './codegen/types.d.ts';
import type { Extension } from './mod.ts';

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
