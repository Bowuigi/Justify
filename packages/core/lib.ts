import { validate as validateQueryResult } from './codegen/query-result-validator.ts';
import { validate as validateQuery } from './codegen/query-validator.ts';
import { validate as validateSystem, type ValidationResult } from './codegen/system-validator.ts';
import type { Query, QueryResult, System } from './codegen/types.d.ts';
import { displayIterable, type Diagnostic } from './diagnostics.ts';

export type * from './codegen/types.d.ts';
export * from './diagnostics.ts';

export type LoadResult<T> =
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
      relatedLocations:
        error.path.length > 0 ? [{ label: 'In', location: { is: 'path', path: error.path } }] : [],
    });
  }

  return { success: false, diagnostics };
}

function fromJSONString<T>(
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

export function systemFromJSONString(filename: string, jsonString: string): LoadResult<System> {
  return fromJSONString(validateSystem, filename, jsonString);
}

export function queryFromJSONString(filename: string, jsonString: string): LoadResult<Query> {
  return fromJSONString(validateQuery, filename, jsonString);
}

export function queryResultFromJSONString(
  filename: string,
  jsonString: string,
): LoadResult<QueryResult> {
  return fromJSONString(validateQueryResult, filename, jsonString);
}
