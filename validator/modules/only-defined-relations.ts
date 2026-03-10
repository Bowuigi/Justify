import type * as T from '../../formats/driver.ts';
import * as C from '../module-common.ts';

export const managedError = 'ODR' as const;

export interface UndefinedRelationInPremise extends C.ModuleError<'ODR', 'P'> {
  relationId: string,
  allRelationIds: Array<string>,
}

export interface UndefinedRelationInQuery extends C.ModuleError<'ODR', 'Q'> {
  relationId: string,
  allRelationIds: Array<string>,
}

export type PushedError = UndefinedRelationInPremise | UndefinedRelationInQuery;

export function onQuery(errors: C.ErrorStack<PushedError>, path: C.LocationPath, query: T.Query, system: T.System) {
  if (!(query.relation in system.relations)) {
    errors.push({
      moduleId: 'ODR',
      id: 'ODR-Q',
      sourceOfTruthLocation: ['system', 'relations'],
      location: path,
      relationId: query.relation,
      allRelationIds: Object.keys(system.relations),
    });
  }
}

export function onPremise(errors: C.ErrorStack<PushedError>, path: C.LocationPath, premise: T.SystemRelationRulePremise, system: T.System) {
  if (!(premise.relation in system.relations)) {
    errors.push({
      moduleId: 'ODR',
      id: 'ODR-P',
      sourceOfTruthLocation: ['system', 'relations'],
      location: path,
      relationId: premise.relation,
      allRelationIds: Object.keys(system.relations),
    });
  }
}

export function formatError(err: PushedError): C.ModuleErrorInfo {
  switch (err.id) {
    case 'ODR-P':
      return {
        message: `Undefined relation in premise: ${C.highlightWrong(err.relationId)}`,
        hints: [`Expected ${C.displayIterable('relation','relations', err.allRelationIds)}`],
        location: err.location,
        sourceOfTruthLocation: err.sourceOfTruthLocation,
        id: err.id,
      };
    case 'ODR-Q':
      return {
        message: `Undefined relation in query: ${C.highlightWrong(err.relationId)}`,
        hints: [`Expected ${C.displayIterable('relation','relations', err.allRelationIds)}`],
        location: err.location,
        sourceOfTruthLocation: err.sourceOfTruthLocation,
        id: err.id,
      };
  }
}
