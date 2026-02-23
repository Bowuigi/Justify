import { Query, System, SystemRelationRulePremise } from "../../formats/driver.ts";
import { displayIterable, ErrorStack, ModuleError, ModuleErrorInfo, Path } from "../module-common.ts";

export const managedError = 'ODR' as const;

export interface UndefinedRelationInPremise extends ModuleError<'ODR', 'P'> {
  relationId: string,
  allRelationIds: Array<string>,
}

export interface UndefinedRelationInQuery extends ModuleError<'ODR', 'Q'> {
  relationId: string,
  allRelationIds: Array<string>,
}

export type PushedError = UndefinedRelationInPremise | UndefinedRelationInQuery;

export function onQuery(errors: ErrorStack<UndefinedRelationInQuery>, path: Path, query: Query, system: System) {
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

export function onPremise(errors: ErrorStack<UndefinedRelationInPremise>, path: Path, premise: SystemRelationRulePremise, system: System) {
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

export function formatError(err: PushedError): ModuleErrorInfo {
  switch (err.id) {
    case 'ODR-P':
      return {
        message: `Undefined relation in premise: ${err.relationId}`,
        hints: [`Available ${displayIterable('relation','relations', err.allRelationIds)}`],
        location: err.location,
        sourceOfTruthLocation: err.sourceOfTruthLocation,
      };
    case 'ODR-Q':
      return {
        message: `Undefined relation in query: ${err.relationId}`,
        hints: [`Available ${displayIterable('relation','relations', err.allRelationIds)}`],
        location: err.location,
        sourceOfTruthLocation: err.sourceOfTruthLocation,
      };
  }
}
