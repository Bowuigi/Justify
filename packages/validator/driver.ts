import type {
  Derivation,
  DerivationTerm,
  DerivationTree,
  Query,
  System,
  Term,
  TexMath
} from '@justify/core';
import * as Fused from './codegen/fused.ts';
import type { DTLocationPath, ErrorStack, LocationPath, ModuleErrorInfo } from './module-common.ts';

function onTerm(
  errors: ErrorStack<Fused.PushedError>,
  path: LocationPath,
  variables: Record<string, TexMath>,
  literals: Record<string, TexMath>,
  term: Term,
  system: System
): void {
  switch (term.is) {
    case 'ref':
      return Fused.onTermRef(errors, path, variables, literals, term, system);
    case 'con':
      Fused.onTermCon(errors, path, variables, literals, term, system);
      for (const arg of term.args) {
        onTerm(errors, path, variables, literals, arg, system);
      }
      break;
  }
}

function onDerivationTerm(
  errors: ErrorStack<Fused.PushedError>,
  path: DTLocationPath,
  drvTerm: DerivationTerm,
  system: System
): void {
  switch (drvTerm.is) {
    case 'lit':
      Fused.onDerivationTermLit(errors, path, drvTerm, system);
      break;
    case 'var':
      Fused.onDerivationTermVar(errors, path, drvTerm, system);
      break;
    case 'con':
      Fused.onDerivationTermCon(errors, path, drvTerm, system);
      for (const arg of drvTerm.args) {
        onDerivationTerm(errors, path, arg, system);
      }
      break;
  }
}

function onDerivation(
  errors: ErrorStack<Fused.PushedError>,
  path: DTLocationPath,
  derivation: Derivation,
  system: System
): void {
  Fused.onDerivation(errors, path, derivation, system);

  for (const [premIx, prem] of derivation.premises.entries()) {
    onDerivation(errors, [...path, 'premises', premIx], prem, system);
  }

  for (const [argIx, arg] of derivation.args.entries()) {
    onDerivationTerm(errors, [...path, 'arguments', argIx], arg, system);
  }
}

export function validateSystem(system: System): Array<ModuleErrorInfo> {
  const errors: Array<Fused.PushedError> = [];

  for (const [syncatId, syncatDef] of Object.entries(system.syntax)) {
    Fused.onSynCat(errors, ['system', 'syntax', syncatId], syncatId, syncatDef, system);
    for (const grammar of syncatDef.grammar) {
      Fused.onGrammar(
        errors,
        ['system', 'syntax', syncatId, 'grammar', grammar.id],
        grammar,
        system
      );
      for (const arg of grammar.arguments) {
        Fused.onArgument(
          errors,
          ['system', 'syntax', syncatId, 'grammar', grammar.id, 'arguments', arg.id],
          arg,
          system
        );
      }
    }
  }

  for (const [relId, relDef] of Object.entries(system.relations)) {
    Fused.onRelation(errors, ['system', 'relations', relId], relId, relDef, system);
    for (const arg of relDef.arguments) {
      Fused.onArgument(errors, ['system', 'relations', relId, 'arguments', arg.id], arg, system);
    }
    for (const rule of relDef.rules) {
      Fused.onRule(errors, ['system', 'relations', relId, 'rules', rule.rule.id], rule, system);
      Fused.onIdentifierMap(errors, [
        'system',
        'relations',
        relId,
        'rules',
        rule.rule.id,
        'literals'
      ], rule.literals);
      Fused.onIdentifierMap(errors, [
        'system',
        'relations',
        relId,
        'rules',
        rule.rule.id,
        'variables'
      ], rule.variables);
      Fused.onPatterns(
        errors,
        ['system', 'relations', relId, 'rules', rule.rule.id, 'patterns'],
        relId,
        rule.patterns,
        system
      );
      for (const [patternVar, patternBody] of Object.entries(rule.patterns)) {
        onTerm(
          errors,
          ['system', 'relations', relId, 'rules', rule.rule.id, 'patterns', patternVar],
          rule.variables,
          rule.literals,
          patternBody,
          system
        );
      }
      for (const [premiseIx, premise] of rule.premises.entries()) {
        Fused.onPremise(
          errors,
          ['system', 'relations', relId, 'rules', rule.rule.id, 'premises', premiseIx],
          premise,
          system
        );
        for (const [argIx, arg] of premise.args.entries()) {
          onTerm(
            errors,
            [
              'system',
              'relations',
              relId,
              'rules',
              rule.rule.id,
              'premises',
              premiseIx,
              'arguments',
              argIx
            ],
            rule.variables,
            rule.literals,
            arg,
            system
          );
        }
      }
    }
  }
  return (errors as Array<Fused.PushedError>).map(Fused.formatError);
}

export function validateQuery(query: Query, system: System): Array<ModuleErrorInfo> {
  const errors: Array<Fused.PushedError> = [];

  Fused.onQuery(errors, ['query'], query, system);
  Fused.onIdentifierMap(errors, ['query', 'literals'], query.literals);
  Fused.onIdentifierMap(errors, ['query', 'variables'], query.variables);

  for (const [argIx, arg] of query.args.entries()) {
    onTerm(errors, ['query', 'args', argIx], query.variables, query.literals, arg, system);
  }

  return (errors as Array<Fused.PushedError>).map(Fused.formatError);
}

export function validateDerivationTree(
  drvTree: DerivationTree,
  system: System
): Array<ModuleErrorInfo> {
  const errors: Array<Fused.PushedError> = [];

  // Fused.onDerivationTree(errors, ['derivation-tree'], drvTree, system);
  for (const [drvIx, drv] of drvTree.entries()) {
    onDerivation(errors, ['derivation-tree', drvIx], drv, system);
  }
  return (errors as Array<Fused.PushedError>).map(Fused.formatError);
}
