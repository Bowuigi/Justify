import type { Query, QueryResult, System } from '@justify/core';
import { expect } from 'vitest';

import { validateQuery, validateQueryResult, validateSystem } from './driver.ts';
import type { ModuleErrorInfo } from './module-common.ts';

expect.extend({
  toBeAValidSystem(system: System) {
    const { isNot, utils } = this;
    const givenErrors = validateSystem(system);
    return {
      pass: givenErrors.length === 0,
      message: () => {
        if (isNot) {
          return `This System is valid (when it's not supposed to be). No validation errors reported.`;
        }
        return `This System is invalid. Reported errors:\n${utils.printDiffOrStringify(givenErrors, [])}`;
      },
    };
  },
  toHaveAValidQuery(system: System, query: Query) {
    const { isNot, utils } = this;
    const givenErrors = validateQuery(query, system);
    return {
      pass: givenErrors.length === 0,
      message: () => {
        if (isNot) {
          return `This Query is valid (when it's not supposed to be). No validation errors reported.`;
        }
        return `This Query is invalid. Reported errors:\n${utils.printDiffOrStringify(givenErrors, [])}`;
      },
    };
  },
  toHaveAValidQueryResult(system: System, queryResult: QueryResult) {
    const { isNot, utils } = this;
    const givenErrors = validateQueryResult(queryResult, system);
    return {
      pass: givenErrors.length === 0,
      message: () => {
        if (isNot) {
          return `QueryResult is valid (when it's not supposed to be). No validation errors reported.`;
        }
        return `QueryResult is invalid. Reported errors:\n${utils.printDiffOrStringify(givenErrors, [])}`;
      },
    };
  },
  toBeASystemReturningValidationErrors(system: System, errors: Partial<ModuleErrorInfo>) {
    const { isNot, utils } = this;
    const givenErrors = validateSystem(system);
    const match = givenErrors.every(actual => this.equals(actual, expect.objectContaining(errors)));
    return {
      pass: match,
      message: () => {
        if (isNot) {
          return `System validation errors partially-match (when they shouldn't).`;
        }
        return `System validation errors don't partially-match.\n${utils.printDiffOrStringify(givenErrors, errors)}`;
      },
    };
  },
  toBeAQueryReturningValidationErrors(
    system: System,
    query: Query,
    errors: Partial<ModuleErrorInfo>,
  ) {
    const { isNot, utils } = this;
    const givenErrors = validateQuery(query, system);
    const match = givenErrors.some(actual => this.equals(actual, expect.objectContaining(errors)));
    return {
      pass: match,
      message: () => {
        if (isNot) {
          return `Query validation errors partially-match (when they shouldn't).`;
        }
        return `Query validation errors don't partially-match.\n${utils.printDiffOrStringify(givenErrors, errors)}`;
      },
    };
  },
  toBeAQueryResultReturningValidationErrors(
    system: System,
    queryResult: QueryResult,
    errors: Partial<ModuleErrorInfo>,
  ) {
    const { isNot, utils } = this;
    const givenErrors = validateQueryResult(queryResult, system);
    const match = givenErrors.some(actual => this.equals(actual, expect.objectContaining(errors)));
    return {
      pass: match,
      message: () => {
        if (isNot) {
          return `QueryResult validation errors partially-match (when they shouldn't).`;
        }
        return `QueryResult validation errors don't partially-match.\n${utils.printDiffOrStringify(givenErrors, errors)}`;
      },
    };
  },
});
