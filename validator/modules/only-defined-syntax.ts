import type * as T from '../../formats/driver.ts';
import * as C from '../module-common.ts';

export const managedError = 'ODS' as const;

export interface UndefinedSynCat extends C.ModuleError<'ODS', 'S'> {
  syncatId: string,
  allSynCatIds: Array<string>,
}

export interface UndefinedConstructor extends C.ModuleError<'ODS', 'C'> {
  syncatId: string,
  conId: string,
  allConIds: Array<string>,
}

export interface PrimitiveDisallowedHere extends C.ModuleError<'ODS', 'P'> {
  syncatId: string,
}

export type PushedError = UndefinedSynCat | UndefinedConstructor | PrimitiveDisallowedHere;

function isPrimitive(id: string) {
  return id === 'identifier';
}

export function onTermCon(errors: C.ErrorStack<PushedError>, path: C.LocationPath, variables: Record<string, T.TexMath>, literals: Record<string, T.TexMath>, term: T.TermCon, system: T.System) {
  if (isPrimitive(term.from)) {
    errors.push({
      moduleId: 'ODS',
      id: 'ODS-P',
      sourceOfTruthLocation: null,
      location: path,
      syncatId: term.from,
    });
  }

  if (!(term.from in system.syntax) && !isPrimitive(term.from)) {
    errors.push({
      moduleId: 'ODS',
      id: 'ODS-S',
      sourceOfTruthLocation: ['system', 'syntax'],
      location: path,
      syncatId: term.from,
      allSynCatIds: Object.keys(system.syntax),
    });
  }

  if (system.syntax[term.from]?.grammar.findIndex(g => g.id === term.tag) === -1) {
    errors.push({
      moduleId: 'ODS',
      id: 'ODS-C',
      sourceOfTruthLocation: ['system', 'syntax', term.from],
      location: path,
      syncatId: term.from,
      conId: term.tag,
      allConIds: system.syntax[term.from].grammar.map(g => g.id),
    });
  }
}

export function onArgument(errors: C.ErrorStack<PushedError>, path: C.LocationPath, arg: T.Argument, system: T.System) {
  if (!(arg.from in system.syntax) && !isPrimitive(arg.from)) {
    errors.push({
      moduleId: 'ODS',
      id: 'ODS-S',
      sourceOfTruthLocation: ['system', 'syntax'],
      location: path,
      syncatId: arg.from,
      allSynCatIds: Object.keys(system.syntax),
    });
  }
}

export function formatError(err: PushedError): C.ModuleErrorInfo {
  switch (err.id) {
    case 'ODS-S':
      return {
        message: `Undefined syntax category ${C.highlightWrong(err.syncatId)}`,
        hints: [`Expected ${C.displayIterable('identifier', 'any of the following', err.allSynCatIds)}`],
        location: err.location,
        sourceOfTruthLocation: err.sourceOfTruthLocation,
        id: err.id,
      };
    case 'ODS-C':
      return {
        message: `Undefined constructor ${C.highlightWrong(err.conId)} in syntax category ${C.highlight(err.syncatId)}`,
        hints: [`Expected ${C.displayIterable('identifier', 'any of the following', err.allConIds)}`],
        location: err.location,
        sourceOfTruthLocation: err.sourceOfTruthLocation,
        id: err.id,
      };
    case 'ODS-P':
      return {
        message: `Primitive ${C.highlightWrong(err.syncatId)} not allowed here`,
        hints: [],
        location: err.location,
        sourceOfTruthLocation: err.sourceOfTruthLocation,
        id: err.id,
      };
  }
}
