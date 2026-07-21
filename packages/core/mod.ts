// deno-lint-ignore-file no-console

// deno-lint-ignore no-external-import
import { readFile } from 'node:fs/promises';

import type { ValidationResult } from './codegen/system-validator.ts';
import { validate as validateSystem } from './codegen/system-validator.ts';
import { validate as validateQuery } from './codegen/query-validator.ts';
import { validate as validateDerivationTree } from './codegen/derivation-tree-validator.ts';
import type { DerivationTree, Query, System } from './codegen/types.d.ts';

async function parseFile<T>(
  validate: (data: unknown) => ValidationResult,
  filename: string
): Promise<T | null> {
  let contents: string;
  let json;

  try {
    contents = await readFile(filename, { encoding: 'utf8' });
    json = JSON.parse(contents);
  } catch (exn: unknown) {
    if (exn instanceof Error) {
      console.error(`${filename}, ${exn.name}: ${exn.message}`);
    } else {
      console.error(`${filename}, fatal error: ${exn}`);
    }
    return null;
  }

  const valid = validate(json);

  if (valid.success) {
    return json as T;
  } else {
    for (const error of valid.errors) {
      console.error(`${filename}, /${error.path.join('/')}: ${error.message}`);
      if (error.suggestions.length > 0) {
        console.error(`  Suggestions: ${error.suggestions.join(', ')}`);
      }
    }
    return null;
  }
}

export type * from './codegen/types.d.ts';

export function parseSystem(filename: string): Promise<System | null> {
  return parseFile<System>(validateSystem, filename);
}
export function parseQuery(filename: string): Promise<Query | null> {
  return parseFile<Query>(validateQuery, filename);
}
export function parseDerivationTree(filename: string): Promise<DerivationTree | null> {
  return parseFile<DerivationTree>(validateDerivationTree, filename);
}
