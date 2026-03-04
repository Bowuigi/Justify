import type * as T from "../../formats/driver.ts"
import type * as C from "../module-common.ts"
import * as PMA from "../modules/pattern-match-arguments.ts"
import * as ODR from "../modules/only-defined-relations.ts"
import * as ODS from "../modules/only-defined-syntax.ts"

export type PushedError = | PMA.PushedError | ODR.PushedError | ODS.PushedError;

export function onPatterns(errors: C.ErrorStack<PushedError>, path: C.LocationPath, relationId: string, patterns: T.SystemRelationRule['patterns'], system: T.System) {
  PMA.onPatterns(...arguments);
}

export function onTermCon(errors: C.ErrorStack<PushedError>, path: C.LocationPath, variables: Record<string, T.TexMath>, literals: Record<string, T.TexMath>, term: T.TermCon, system: T.System) {
  ODS.onTermCon(...arguments);
}

export function onArgument(errors: C.ErrorStack<PushedError>, path: C.LocationPath, arg: T.Argument, system: T.System) {
  ODS.onArgument(...arguments);
}

export function onPremise(errors: C.ErrorStack<PushedError>, path: C.LocationPath, premise: T.SystemRelationRulePremise, system: T.System) {
  ODR.onPremise(...arguments);
}

export function onQuery(errors: C.ErrorStack<PushedError>, path: C.LocationPath, query: T.Query, system: T.System) {
  ODR.onQuery(...arguments);
}

export function formatError(err: PushedError): C.ModuleErrorInfo {
  switch (err.moduleId) {
    case "PMA": return PMA.formatError(err);
    case "ODR": return ODR.formatError(err);
    case "ODS": return ODS.formatError(err);
  }
}
