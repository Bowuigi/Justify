import 'vitest';
import type { Query, QueryResult } from '@justify/core';
import type { ModuleErrorInfo } from '@justify/validator';

declare module 'vitest' {
  interface Matchers<R, T> {
    /// Validator
    toBeAValidSystem: () => R;
    toHaveAValidQuery: (query: Query) => R;
    toHaveAValidQueryResult: (queryResult: QueryResult) => R;
    toBeASystemReturningValidationErrors: (errors: Partial<ModuleErrorInfo>) => R;
    toBeAQueryReturningValidationErrors: (query: Query, errors: Partial<ModuleErrorInfo>) => R;
    toBeAQueryResultReturningValidationErrors: (
      queryResult: QueryResult,
      errors: Partial<ModuleErrorInfo>,
    ) => R;
  }
}
