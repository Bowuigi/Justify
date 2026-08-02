import type * as T from '@justify/core';
import type * as C from '../module-common.ts';
import * as VI from '../modules/valid-identifiers.ts';
import * as PMA from '../modules/pattern-match-arguments.ts';
import * as CAC from '../modules/correct-argument-count.ts';
import * as ODR from '../modules/only-defined-relations.ts';
import * as ODS from '../modules/only-defined-syntax.ts';

export type PushedError =
  | VI.PushedError
  | PMA.PushedError
  | CAC.PushedError
  | ODR.PushedError
  | ODS.PushedError;

export function onDerivationTermLit(
  errors: C.ErrorStack<PushedError>,
  path: C.DTLocationPath,
  lit: T.DerivationTermLit,
  system: T.System
): void {
  VI.onDerivationTermLit(errors, path, lit, system);
}

export function onPatterns(
  errors: C.ErrorStack<PushedError>,
  path: C.LocationPath,
  relationId: T.Identifier,
  patterns: T.SystemRelationRule['patterns'],
  system: T.System
): void {
  VI.onPatterns(errors, path, relationId, patterns, system);
  PMA.onPatterns(errors, path, relationId, patterns, system);
}

export function onRelation(
  errors: C.ErrorStack<PushedError>,
  path: C.LocationPath,
  relId: T.Identifier,
  relDef: T.SystemRelation,
  system: T.System
): void {
  VI.onRelation(errors, path, relId, relDef, system);
}

export function onSynCat(
  errors: C.ErrorStack<PushedError>,
  path: C.LocationPath,
  syncatId: T.Identifier,
  syncatDef: T.SystemSyntax,
  system: T.System
): void {
  VI.onSynCat(errors, path, syncatId, syncatDef, system);
}

export function onDerivationTermVar(
  errors: C.ErrorStack<PushedError>,
  path: C.DTLocationPath,
  termVar: T.DerivationTermVar,
  system: T.System
): void {
  VI.onDerivationTermVar(errors, path, termVar, system);
}

export function onDerivation(
  errors: C.ErrorStack<PushedError>,
  path: C.DTLocationPath,
  derivation: T.Derivation,
  system: T.System
): void {
  VI.onDerivation(errors, path, derivation, system);
}

export function onTermCon(
  errors: C.ErrorStack<PushedError>,
  path: C.LocationPath,
  variables: Record<T.Identifier, T.TexMath>,
  literals: Record<T.Identifier, T.TexMath>,
  term: T.TermCon,
  system: T.System
): void {
  ODS.onTermCon(errors, path, variables, literals, term, system);
  VI.onTermCon(errors, path, variables, literals, term, system);
  CAC.onTermCon(errors, path, variables, literals, term, system);
}

export function onGrammar(
  errors: C.ErrorStack<PushedError>,
  path: C.LocationPath,
  grammar: T.SystemSyntaxGrammar,
  system: T.System
): void {
  VI.onGrammar(errors, path, grammar, system);
}

export function onArgument(
  errors: C.ErrorStack<PushedError>,
  path: C.LocationPath,
  arg: T.Argument,
  system: T.System
): void {
  ODS.onArgument(errors, path, arg, system);
  VI.onArgument(errors, path, arg, system);
}

export function onRule(
  errors: C.ErrorStack<PushedError>,
  path: C.LocationPath,
  rule: T.SystemRelationRule,
  system: T.System
): void {
  VI.onRule(errors, path, rule, system);
}

export function onPremise(
  errors: C.ErrorStack<PushedError>,
  path: C.LocationPath,
  premise: T.SystemRelationRulePremise,
  system: T.System
): void {
  VI.onPremise(errors, path, premise, system);
  ODR.onPremise(errors, path, premise, system);
  CAC.onPremise(errors, path, premise, system);
}

export function onTermRef(
  errors: C.ErrorStack<PushedError>,
  path: C.LocationPath,
  variables: Record<T.Identifier, T.TexMath>,
  literals: Record<T.Identifier, T.TexMath>,
  term: T.TermRef,
  system: T.System
): void {
  VI.onTermRef(errors, path, variables, literals, term, system);
}

export function onDerivationTermCon(
  errors: C.ErrorStack<PushedError>,
  path: C.DTLocationPath,
  con: T.DerivationTermCon,
  system: T.System
): void {
  VI.onDerivationTermCon(errors, path, con, system);
}

export function onIdentifierMap(
  errors: C.ErrorStack<PushedError>,
  path: C.LocationPath,
  idmap: Record<T.Identifier, T.TexMath>
): void {
  VI.onIdentifierMap(errors, path, idmap);
}

export function onQuery(
  errors: C.ErrorStack<PushedError>,
  path: C.LocationPath,
  query: T.Query,
  system: T.System
): void {
  VI.onQuery(errors, path, query, system);
  ODR.onQuery(errors, path, query, system);
}

export function formatError(err: PushedError): C.ModuleErrorInfo {
  switch (err.moduleId) {
    case 'VI':
      return VI.formatError(err);
    case 'PMA':
      return PMA.formatError(err);
    case 'CAC':
      return CAC.formatError(err);
    case 'ODR':
      return ODR.formatError(err);
    case 'ODS':
      return ODS.formatError(err);
  }
}
