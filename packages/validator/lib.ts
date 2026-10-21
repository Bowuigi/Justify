import type { Diagnostic, Query, QueryResult, System } from '@justify/core';

import {
  validateQuery as validateQueryDriver,
  validateQueryResult as validateQueryResultDriver,
  validateSystem as validateSystemDriver,
} from './driver.ts';
import type { ModuleErrorInfo } from './module-common.ts';

function toDiagnostic(mei: ModuleErrorInfo, filename: string): Diagnostic {
  const relatedLocations: Array<Diagnostic['relatedLocations'][number]> = [
    { label: 'In', location: { is: 'path', path: mei.location } },
  ];

  if (mei.sourceOfTruthLocation !== null) {
    relatedLocations.push({
      label: 'Conflicts with',
      location: { is: 'path', path: mei.sourceOfTruthLocation },
    });
  }

  return {
    source: filename,
    origin: 'validator',
    code: mei.id,
    message: mei.message,
    hints: mei.hints,
    relatedLocations,
  };
}

export function validateSystem(system: System, filename: string): Array<Diagnostic> {
  return validateSystemDriver(system).map(mei => toDiagnostic(mei, filename));
}

export function validateQuery(query: Query, system: System, filename: string): Array<Diagnostic> {
  return validateQueryDriver(query, system).map(mei => toDiagnostic(mei, filename));
}

export function validateQueryResult(
  queryResult: QueryResult,
  system: System,
  filename: string,
): Array<Diagnostic> {
  return validateQueryResultDriver(queryResult, system).map(mei => toDiagnostic(mei, filename));
}
