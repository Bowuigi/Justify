import { readFile } from 'node:fs/promises';

import { validate as validateQueryResult } from './codegen/query-result-validator.ts';
import { validate as validateQuery } from './codegen/query-validator.ts';
import { validate as validateSystem, type ValidationResult } from './codegen/system-validator.ts';
import type { Query, QueryResult, System } from './codegen/types.d.ts';
import { displayIterable, type Diagnostic } from './diagnostics.ts';

type LoadResult<T> =
  | { success: true; value: T }
  | { success: false; diagnostics: Array<Diagnostic> };

function fromJSON<T>(
  validate: (data: unknown) => ValidationResult,
  filename: string,
  json: unknown,
): LoadResult<T> {
  const valid = validate(json);

  if (valid.success) {
    return { success: true, value: json as T };
  }

  const diagnostics: Array<Diagnostic> = [];
  for (const error of valid.errors) {
    diagnostics.push({
      origin: 'json-parsing',
      source: filename,
      message: [error.message],
      hints:
        error.suggestions.length > 0
          ? [['Did you mean ', ...displayIterable('this', 'any of those', error.suggestions)]]
          : [],
      relatedLocations: [{ label: 'In', location: { is: 'path', path: error.path } }],
    });
  }

  return { success: false, diagnostics };
}

async function parseFile<T>(
  validate: (data: unknown) => ValidationResult,
  filename: string,
): Promise<T | null> {
  try {
    const contents = await readFile(filename, { encoding: 'utf8' });
    const json = JSON.parse(contents);

    const valid = validate(json);

    if (valid.success) {
      return json as T;
    }

    for (const error of valid.errors) {
      console.error(`${filename}: ${error.message}\n  In /${error.path.join('/')}`);
      if (error.suggestions.length > 0) {
        console.error(`  Suggestions: ${error.suggestions.join(', ')}`);
      }
      // Newline
      console.error('');
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

export function fromJSONString<T>(
  validate: (data: unknown) => ValidationResult,
  filename: string,
  jsonString: string,
): LoadResult<T> {
  let json: unknown;
  try {
    json = JSON.parse(jsonString);
  } catch (error: unknown) {
    return {
      success: false,
      diagnostics: [
        {
          source: filename,
          origin: 'json-parsing',
          message: [error instanceof Error ? error.message : `${error}`],
          hints: [],
          relatedLocations: [],
        },
      ],
    };
  }
  return fromJSON<T>(validate, filename, json);
}

// --- exports ---

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
