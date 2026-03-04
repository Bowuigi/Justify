import { Query, System, Term, TexMath } from '../formats/driver.ts';
import * as Fused from './codegen/fused.ts'
import { ErrorStack, LocationPath, ModuleErrorInfo } from './module-common.ts';

function onTerm(errors: ErrorStack<any>, path: LocationPath, variables: Record<string, TexMath>, literals: Record<string, TexMath>, term: Term, system: System) {
  switch (term.is) {
    case 'ref':
      return
      // return Fused.onTermRef(errors, path, variables, literals, term, system);
    case 'con':
      Fused.onTermCon(errors, path, variables, literals, term, system);
      for (const arg of term.args) {
        onTerm(errors, path, variables, literals, arg, system);
      }
      break;
  }
}

export function validateSystem(system: System): Array<ModuleErrorInfo> {
  // Disallow operations other than single-item push
  let errors: ErrorStack<Fused.PushedError> = [] as any;

  for (const [syncatId, syncatDef] of Object.entries(system.syntax)) {
    for (const grammar of syncatDef.grammar) {
      for (const arg of grammar.arguments) {
        Fused.onArgument(errors, ['system', 'syntax', syncatId, 'grammar', grammar.id, 'arguments', arg.id], arg, system);
      }
    }
  }

  for (const [relId, relDef] of Object.entries(system.relations)) {
    for (const arg of relDef.arguments) {
      Fused.onArgument(errors, ['system', 'relations', relId, 'arguments', arg.id], arg, system);
    }
    for (const rule of relDef.rules) {
      Fused.onPatterns(errors, ['system', 'relations', relId, 'rules', rule.rule.id, 'patterns'], relId, rule.patterns, system);
      for (const [patternVar, patternBody] of Object.entries(rule.patterns)) {
        onTerm(errors, ['system', 'relations', relId, 'rules', rule.rule.id, 'patterns', patternVar], rule.variables, rule.literals, patternBody, system);
      }
      for (const premise of rule.premises) {
        Fused.onPremise(errors, ['system', 'relations', relId, 'rules', rule.rule.id, 'premises'], premise, system);
        for (const [argIx, arg] of premise.args.entries()) {
          onTerm(errors, ['system', 'relations', relId, 'rules', rule.rule.id, 'premises', argIx], rule.variables, rule.literals, arg, system);
        }
      }
    }
  }
  return (errors as Array<Fused.PushedError>).map(Fused.formatError);
}

export function validateQuery(query: Query, system: System): Array<ModuleErrorInfo> {
  // Disallow operations other than single-item push
  let errors: ErrorStack<Fused.PushedError> = [] as any;

  Fused.onQuery(errors, ['query'], query, system);
  for (const [argIx, arg] of query.args.entries()) {
    onTerm(errors, ['query', 'args', argIx], query.variables, query.literals, arg, system);
  }

  return (errors as Array<Fused.PushedError>).map(Fused.formatError);
}
