import 'vitest';
import type { Diagnostic, Query, QueryResult } from '@justify/core';

declare module 'vitest' {
  interface Matchers<R, T> {
    /// Validator
    toBeAValidSystem: () => R;
    toHaveAValidQuery: (query: Query) => R;
    toHaveAValidQueryResult: (queryResult: QueryResult) => R;
    toBeASystemReturningValidationErrors: (errors: Partial<Diagnostic>) => R;
    toBeAQueryReturningValidationErrors: (query: Query, errors: Partial<Diagnostic>) => R;
    toBeAQueryResultReturningValidationErrors: (
      queryResult: QueryResult,
      errors: Partial<Diagnostic>,
    ) => R;
  }
}
