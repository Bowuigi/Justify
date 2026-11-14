import type * as T from '@justify/core';

import * as C from '../module-common.ts';

export const managedError = 'CAC' as const;

interface MissingArguments extends C.ModuleError<typeof managedError, 'M'> {
  expectedArgumentIds: Array<string>;
}

interface ExtraArguments extends C.ModuleError<typeof managedError, 'E'> {
  expectedArgumentIds: Array<string>;
}

export type PushedError = MissingArguments | ExtraArguments;

function checkArgumentCount(
  errors: C.ErrorStack<PushedError>,
  path: C.LocationPath,
  actualCount: number,
  expectedArgumentIds: Array<string>,
  sourceOfTruthLocation: C.SourceOfTruthPath | null,
): void {
  if (actualCount < expectedArgumentIds.length) {
    errors.push({
      moduleId: 'CAC',
      id: 'CAC-M',
      location: path,
      sourceOfTruthLocation,
      expectedArgumentIds,
    });
  } else if (actualCount > expectedArgumentIds.length) {
    errors.push({
      moduleId: 'CAC',
      id: 'CAC-E',
      location: path,
      sourceOfTruthLocation,
      expectedArgumentIds,
    });
  }
}

export function onTermCon(
  errors: C.ErrorStack<PushedError>,
  path: C.LocationPath,
  variables: Record<T.Identifier, T.TexMath>,
  literals: Record<T.Identifier, T.TexMath>,
  term: T.TermCon,
  system: T.System,
): void {
  const expectedArgs = system.syntax[term.from]?.grammar.find(g => g.id === term.tag)?.arguments;

  // Error flagged by another module
  if (expectedArgs === undefined) return;

  checkArgumentCount(
    errors,
    path,
    term.args.length,
    expectedArgs.map(a => a.id),
    ['system', 'syntax', term.from, term.tag, 'arguments'],
  );
}

export function onPremise(
  errors: C.ErrorStack<PushedError>,
  path: C.LocationPath,
  premise: T.SystemRelationRulePremise,
  system: T.System,
): void {
  if (premise.relation === 'prim_neq') {
    checkArgumentCount(errors, path, premise.args.length, ['a', 'b'], null);
    return;
  }

  const expectedArgs = system.relations[premise.relation]?.arguments;

  // Error flagged by another module
  if (expectedArgs === undefined) return;

  checkArgumentCount(
    errors,
    path,
    premise.args.length,
    expectedArgs.map(a => a.id),
    ['system', 'relations', premise.relation, 'arguments'],
  );
}

export function onQuery(
  errors: C.ErrorStack<PushedError>,
  path: C.LocationPath,
  query: T.Query,
  system: T.System,
): void {
  if (query.relation !== 'prim_neq') return;

  checkArgumentCount(errors, path, query.args.length, ['a', 'b'], null);
}

export function formatError(err: PushedError): C.ModuleErrorInfo {
  switch (err.id) {
    case 'CAC-M': {
      return {
        message: ['Missing arguments in relation call'],
        hints: [
          ['Expected ', ...C.displayIterable('argument', 'arguments', err.expectedArgumentIds)],
        ],
        location: err.location,
        sourceOfTruthLocation: err.sourceOfTruthLocation,
        id: err.id,
      };
    }
    case 'CAC-E': {
      return {
        message: ['Extra ', ...C.displayIterable('argument', 'arguments', err.expectedArgumentIds)],
        hints: [
          ['Expected ', ...C.displayIterable('argument', 'arguments', err.expectedArgumentIds)],
        ],
        location: err.location,
        sourceOfTruthLocation: err.sourceOfTruthLocation,
        id: err.id,
      };
    }
  }
}
