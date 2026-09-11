import { expect } from 'vitest';

import type { Query, QueryResult, System } from '@justify/core';

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
          return `This System is valid (when it's not supposed to be). No validation errors reported.`
        } else {
          return `This System is invalid. Reported errors:\n${utils.printDiffOrStringify(givenErrors, [])}`
        }
      }
    }
  },
  toBeAValidQueryFor(system: System, query: Query) {
    const { isNot, utils } = this;
    const givenErrors = validateQuery(query, system);
    return {
      pass: givenErrors.length === 0,
      message: () => {
        if (isNot) {
          return `This Query is valid (when it's not supposed to be). No validation errors reported.`
        } else {
          return `This Query is invalid. Reported errors:\n${utils.printDiffOrStringify(givenErrors, [])}`
        }
      }
    }
  },
  toBeAValidQueryResultFor(system: System, queryResult: QueryResult) {
    const { isNot, utils } = this;
    const givenErrors = validateQueryResult(queryResult, system);
    return {
      pass: givenErrors.length === 0,
      message: () => {
        if (isNot) {
          return `This QueryResult is valid (when it's not supposed to be). No validation errors reported.`
        } else {
          return `This QueryResult is invalid. Reported errors:\n${utils.printDiffOrStringify(givenErrors, [])}`
        }
      }
    }
  },
  toBeASystemReturningValidationErrors(system: System, errors: ModuleErrorInfo) {
    const { isNot, utils } = this;
    const givenErrors = validateSystem(system);
    return {
      pass: false, // stub
      message: () => `stub test`
    }
  },
  toBeAQueryReturningValidationErrors(system: System, query: Query, errors: ModuleErrorInfo) {
    const { isNot, utils } = this;
    const givenErrors = validateQuery(query, system);
    return {
      pass: false, // stub
      message: () => `stub test`
    }
  },
  toBeAQueryResultReturningValidationErrors(system: System, queryResult: QueryResult, errors: ModuleErrorInfo) {
    const { isNot, utils } = this;
    const givenErrors = validateQueryResult(queryResult, system);
    return {
      pass: false, // stub
      message: () => `stub test`
    }
  },
});
