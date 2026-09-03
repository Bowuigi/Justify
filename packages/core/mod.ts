// oxlint-disable no-console
import { readFile } from 'node:fs/promises';

import { validate as validateQueryResult } from './codegen/query-result-validator.ts';
import { validate as validateQuery } from './codegen/query-validator.ts';
import { validate as validateSystem, type ValidationResult } from './codegen/system-validator.ts';
import type { Query, QueryResult, System } from './codegen/types.d.ts';

async function parseFile<T>(
  validate: (data: unknown) => ValidationResult,
  filename: string,
): Promise<T | null> {
  try {
    const contents = await readFile(filename, { encoding: 'utf8' });
    const json = JSON.parse(contents);

    const valid = validate(json);

    if (valid.success) {
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      return json as T;
    }

    for (const error of valid.errors) {
      console.error(`${filename}, /${error.path.join('/')}: ${error.message}`);
      if (error.suggestions.length > 0) {
        console.error(`  Suggestions: ${error.suggestions.join(', ')}`);
      }
    }
    return null;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`${filename}, ${error.name}: ${error.message}`);
    } else {
      console.error(`${filename}, fatal error: ${error?.toString()}`);
    }
    return null;
  }
}

export type * from './codegen/types.d.ts';

export async function parseSystem(filename: string): Promise<System | null> {
  const result = await parseFile<System>(validateSystem, filename);
  return result;
}
export async function parseQuery(filename: string): Promise<Query | null> {
  const result = await parseFile<Query>(validateQuery, filename);
  return result;
}
export async function parseQueryResult(filename: string): Promise<QueryResult | null> {
  const result = await parseFile<QueryResult>(validateQueryResult, filename);
  return result;
}
