import type * as T from '../../formats/driver.ts';
import * as C from '../module-common.ts';

export const managedError = 'CAC' as const;

interface MissingArguments extends C.ModuleError<typeof managedError, 'M'> {
  expectedArgumentIds: Array<string>,
}

interface ExtraArguments extends C.ModuleError<typeof managedError, 'E'> {
  expectedArgumentIds: Array<string>,
}

export type PushedError = MissingArguments | ExtraArguments;

export function onTermCon(errors: C.ErrorStack<PushedError>, path: C.LocationPath, variables: Record<string, T.TexMath>, literals: Record<string, T.TexMath>, term: T.TermCon, system: T.System) {
  const expectedArgs = system.syntax[term.from]?.grammar.find(g => g.id === term.tag)?.arguments;

  // Error flagged by another module
  if (expectedArgs === undefined) return;

  if (term.args.length < expectedArgs.length) {
    errors.push({
      moduleId: 'CAC',
      id: 'CAC-M',
      location: path,
      sourceOfTruthLocation: ['system', 'syntax', term.from, term.tag, 'arguments'],
      expectedArgumentIds: expectedArgs.map(a => a.id),
    });
  } else if (term.args.length < expectedArgs.length) {
    errors.push({
      moduleId: 'CAC',
      id: 'CAC-E',
      location: path,
      sourceOfTruthLocation: ['system', 'syntax', term.from, term.tag, 'arguments'],
      expectedArgumentIds: expectedArgs.map(a => a.id),
    });
  }
}

export function onPremise(errors: C.ErrorStack<PushedError>, path: C.LocationPath, premise: T.SystemRelationRulePremise, system: T.System) {
  const expectedArgs = system.relations[premise.relation]?.arguments;

  // Error flagged by another module
  if (expectedArgs === undefined) return;

  if (premise.args.length < expectedArgs.length) {
    errors.push({
      moduleId: 'CAC',
      id: 'CAC-M',
      location: path,
      sourceOfTruthLocation: ['system', 'relations', premise.relation, 'arguments'],
      expectedArgumentIds: expectedArgs.map(a => a.id),
    });
  } else if (premise.args.length < expectedArgs.length) {
    errors.push({
      moduleId: 'CAC',
      id: 'CAC-E',
      location: path,
      sourceOfTruthLocation: ['system', 'relations', premise.relation, 'arguments'],
      expectedArgumentIds: expectedArgs.map(a => a.id),
    });
  }
}

export function formatError(err: PushedError): C.ModuleErrorInfo {
  switch (err.id) {
    case 'CAC-M':
      return {
        message: `Missing arguments in relation call`,
        hints: [`Expected ${C.displayIterable('argument', 'arguments', err.expectedArgumentIds)}`],
        location: err.location,
        sourceOfTruthLocation: err.sourceOfTruthLocation,
        id: err.id,
      };
    case 'CAC-E':
      return {
        message: `Extra ${C.displayIterable('argument', 'arguments', err.expectedArgumentIds)}`,
        hints: [`Expected ${C.displayIterable('argument', 'arguments', err.expectedArgumentIds)}`],
        location: err.location,
        sourceOfTruthLocation: err.sourceOfTruthLocation,
        id: err.id,
      };
  }
}
