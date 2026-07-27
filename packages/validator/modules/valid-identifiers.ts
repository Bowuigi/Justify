import type * as T from '@justify/core';
import * as C from '../module-common.ts';

export const managedError = 'VI' as const;

export interface InvalidIdentifier extends C.ModuleError<'VI', 'I'> {
  identifier: string,
}

export type PushedError = InvalidIdentifier;

function isValidIdentifier(id: string): boolean {
  return /^[a-z][a-z0-9_]$/.test(id);
}

function validIdCheck(errors: C.ErrorStack<PushedError>, path: C.LocationPath, str: T.Identifier): void {
  if (!isValidIdentifier(str)) {
    errors.push({
      moduleId: 'VI',
      id: 'VI-I',
      sourceOfTruthLocation: null,
      location: path,
      identifier: str,
    })
  }
}

// @ts-ignore 6133 - Cannot remove variable parameters due to codegen specifics
export function onDerivation(errors: C.ErrorStack<PushedError>, path: C.DTLocationPath, derivation: T.Derivation, system: T.System): void {
  validIdCheck(errors, path, derivation.relation);
  validIdCheck(errors, path, derivation.rule);
}

// @ts-ignore 6133 - Cannot remove variable parameters due to codegen specifics
export function onDerivationTermLit(errors: C.ErrorStack<PushedError>, path: C.DTLocationPath, lit: T.DerivationTermLit, system: T.System): void {
  validIdCheck(errors, path, lit.id);
}

// @ts-ignore 6133 - Cannot remove variable parameters due to codegen specifics
export function onDerivationTermVar(errors: C.ErrorStack<PushedError>, path: C.DTLocationPath, termVar: T.DerivationTermVar, system: T.System): void {
  validIdCheck(errors, path, termVar.id);
}

// @ts-ignore 6133 - Cannot remove variable parameters due to codegen specifics
export function onDerivationTermCon(errors: C.ErrorStack<PushedError>, path: C.DTLocationPath, con: T.DerivationTermCon, system: T.System): void {
  validIdCheck(errors, path, con.from);
  validIdCheck(errors, path, con.tag);
}

// @ts-ignore 6133 - Cannot remove variable parameters due to codegen specifics
export function onTermRef(errors: C.ErrorStack<PushedError>, path: C.LocationPath, variables: Record<T.Identifier, T.TexMath>, literals: Record<T.Identifier, T.TexMath>, term: T.TermRef, system: T.System): void {
  validIdCheck(errors, path, term.to);
}

// @ts-ignore 6133 - Cannot remove variable parameters due to codegen specifics
export function onTermCon(errors: C.ErrorStack<PushedError>, path: C.LocationPath, variables: Record<T.Identifier, T.TexMath>, literals: Record<T.Identifier, T.TexMath>, term: T.TermCon, system: T.System): void {
  validIdCheck(errors, path, term.from);
  validIdCheck(errors, path, term.tag);
}

// @ts-ignore 6133 - Cannot remove variable parameters due to codegen specifics
export function onArgument(errors: C.ErrorStack<PushedError>, path: C.LocationPath, arg: T.Argument, system: T.System): void {
  validIdCheck(errors, path, arg.from);
  validIdCheck(errors, path, arg.id);
}

// @ts-ignore 6133 - Cannot remove variable parameters due to codegen specifics
export function onPremise(errors: C.ErrorStack<PushedError>, path: C.LocationPath, premise: T.SystemRelationRulePremise, system: T.System): void {
  validIdCheck(errors, path, premise.relation);
}

// @ts-ignore 6133 - Cannot remove variable parameters due to codegen specifics
export function onPatterns(errors: C.ErrorStack<PushedError>, path: C.LocationPath, relationId: T.Identifier, patterns: T.SystemRelationRule['patterns'], system: T.System): void {
  validIdCheck(errors, path, relationId);
  for (const arg of Object.keys(patterns)) {
    validIdCheck(errors, path, arg);
  }
}

// @ts-ignore 6133 - Cannot remove variable parameters due to codegen specifics
export function onQuery(errors: C.ErrorStack<PushedError>, path: C.LocationPath, query: T.Query, system: T.System): void {
  validIdCheck(errors, path, query.relation);
}

// @ts-ignore 6133 - Cannot remove variable parameters due to codegen specifics
export function onSynCat(errors: C.ErrorStack<PushedError>, path: C.LocationPath, syncatId: T.Identifier, syncatDef: T.SystemSyntax, system: T.System): void {
  validIdCheck(errors, path, syncatId);
}

// @ts-ignore 6133 - Cannot remove variable parameters due to codegen specifics
export function onGrammar(errors: C.ErrorStack<PushedError>, path: C.LocationPath, grammar: T.SystemSyntaxGrammar, system: T.System): void {
  validIdCheck(errors, path, grammar.id);
}

// @ts-ignore 6133 - Cannot remove variable parameters due to codegen specifics
export function onRelation(errors: C.ErrorStack<PushedError>, path: C.LocationPath, relId: T.Identifier, relDef: T.SystemRelation, system: T.System): void {
  validIdCheck(errors, path, relId);
}

// @ts-ignore 6133 - Cannot remove variable parameters due to codegen specifics
export function onRule(errors: C.ErrorStack<PushedError>, path: C.LocationPath, rule: T.SystemRelationRule, system: T.System): void {
  validIdCheck(errors, path, rule.rule.id);
}

export function onIdentifierMap(errors: C.ErrorStack<PushedError>, path: C.LocationPath, idmap: Record<T.Identifier, T.TexMath>): void {
  for (const id of Object.keys(idmap)) {
    validIdCheck(errors, path, id);
  }
}

export function formatError(err: PushedError): C.ModuleErrorInfo {
  switch (err.id) {
    case 'VI-I':
      return {
        message: `Improperly formatted identifier ${C.highlightWrong(err.identifier)}`,
        hints: [],
        location: err.location,
        sourceOfTruthLocation: err.sourceOfTruthLocation,
        id: err.id,
      };
  }
}
