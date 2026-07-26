import type * as T from "../../formats/driver.ts"
import type * as C from "../module-common.ts"
import * as VI from "../modules/valid-identifiers.ts"
import * as PMA from "../modules/pattern-match-arguments.ts"
import * as CAC from "../modules/correct-argument-count.ts"
import * as ODR from "../modules/only-defined-relations.ts"
import * as ODS from "../modules/only-defined-syntax.ts"

export type PushedError = | VI.PushedError | PMA.PushedError | CAC.PushedError | ODR.PushedError | ODS.PushedError;

export function onDerivationTermLit(errors: C.ErrorStack<PushedError>, path: C.DTLocationPath, lit: T.DerivationTermLit, system: T.System) {
  // @ts-ignore: 2741 - `arguments` here is known to be the correct type
  VI.onDerivationTermLit(...arguments);
}

export function onPatterns(errors: C.ErrorStack<PushedError>, path: C.LocationPath, relationId: T.Identifier, patterns: T.SystemRelationRule['patterns'], system: T.System) {
  // @ts-ignore: 2741 - `arguments` here is known to be the correct type
  VI.onPatterns(...arguments);
  // @ts-ignore: 2741 - `arguments` here is known to be the correct type
  PMA.onPatterns(...arguments);
}

export function onRelation(errors: C.ErrorStack<PushedError>, path: C.LocationPath, relId: T.Identifier, relDef: T.SystemRelation, system: T.System) {
  // @ts-ignore: 2741 - `arguments` here is known to be the correct type
  VI.onRelation(...arguments);
}

export function onSynCat(errors: C.ErrorStack<PushedError>, path: C.LocationPath, syncatId: T.Identifier, syncatDef: T.SystemSyntax, system: T.System) {
  // @ts-ignore: 2741 - `arguments` here is known to be the correct type
  VI.onSynCat(...arguments);
}

export function onDerivationTermVar(errors: C.ErrorStack<PushedError>, path: C.DTLocationPath, termVar: T.DerivationTermVar, system: T.System) {
  // @ts-ignore: 2741 - `arguments` here is known to be the correct type
  VI.onDerivationTermVar(...arguments);
}

export function onDerivation(errors: C.ErrorStack<PushedError>, path: C.DTLocationPath, derivation: T.Derivation, system: T.System) {
  // @ts-ignore: 2741 - `arguments` here is known to be the correct type
  VI.onDerivation(...arguments);
}

export function onTermCon(errors: C.ErrorStack<PushedError>, path: C.LocationPath, variables: Record<T.Identifier, T.TexMath>, literals: Record<T.Identifier, T.TexMath>, term: T.TermCon, system: T.System) {
  // @ts-ignore: 2741 - `arguments` here is known to be the correct type
  ODS.onTermCon(...arguments);
  // @ts-ignore: 2741 - `arguments` here is known to be the correct type
  VI.onTermCon(...arguments);
  // @ts-ignore: 2741 - `arguments` here is known to be the correct type
  CAC.onTermCon(...arguments);
}

export function onGrammar(errors: C.ErrorStack<PushedError>, path: C.LocationPath, grammar: T.SystemSyntaxGrammar, system: T.System) {
  // @ts-ignore: 2741 - `arguments` here is known to be the correct type
  VI.onGrammar(...arguments);
}

export function onArgument(errors: C.ErrorStack<PushedError>, path: C.LocationPath, arg: T.Argument, system: T.System) {
  // @ts-ignore: 2741 - `arguments` here is known to be the correct type
  ODS.onArgument(...arguments);
  // @ts-ignore: 2741 - `arguments` here is known to be the correct type
  VI.onArgument(...arguments);
}

export function onRule(errors: C.ErrorStack<PushedError>, path: C.LocationPath, rule: T.SystemRelationRule, system: T.System) {
  // @ts-ignore: 2741 - `arguments` here is known to be the correct type
  VI.onRule(...arguments);
}

export function onPremise(errors: C.ErrorStack<PushedError>, path: C.LocationPath, premise: T.SystemRelationRulePremise, system: T.System) {
  // @ts-ignore: 2741 - `arguments` here is known to be the correct type
  VI.onPremise(...arguments);
  // @ts-ignore: 2741 - `arguments` here is known to be the correct type
  ODR.onPremise(...arguments);
  // @ts-ignore: 2741 - `arguments` here is known to be the correct type
  CAC.onPremise(...arguments);
}

export function onTermRef(errors: C.ErrorStack<PushedError>, path: C.LocationPath, variables: Record<T.Identifier, T.TexMath>, literals: Record<T.Identifier, T.TexMath>, term: T.TermRef, system: T.System) {
  // @ts-ignore: 2741 - `arguments` here is known to be the correct type
  VI.onTermRef(...arguments);
}

export function onDerivationTermCon(errors: C.ErrorStack<PushedError>, path: C.DTLocationPath, con: T.DerivationTermCon, system: T.System) {
  // @ts-ignore: 2741 - `arguments` here is known to be the correct type
  VI.onDerivationTermCon(...arguments);
}

export function onIdentifierMap(errors: C.ErrorStack<PushedError>, path: C.LocationPath, idmap: Record<T.Identifier, T.TexMath>) {
  // @ts-ignore: 2741 - `arguments` here is known to be the correct type
  VI.onIdentifierMap(...arguments);
}

export function onQuery(errors: C.ErrorStack<PushedError>, path: C.LocationPath, query: T.Query, system: T.System) {
  // @ts-ignore: 2741 - `arguments` here is known to be the correct type
  VI.onQuery(...arguments);
  // @ts-ignore: 2741 - `arguments` here is known to be the correct type
  ODR.onQuery(...arguments);
}

export function formatError(err: PushedError): C.ModuleErrorInfo {
  switch (err.moduleId) {
    case "VI": return VI.formatError(err);
    case "PMA": return PMA.formatError(err);
    case "CAC": return CAC.formatError(err);
    case "ODR": return ODR.formatError(err);
    case "ODS": return ODS.formatError(err);
  }
}
