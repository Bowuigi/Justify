import {
  queryFromJSONString,
  type DerivationTerm,
  type Diagnostic,
  type QueryResultSolution,
  type System,
} from '@justify/core';
import { performQuery } from '@justify/inferencer';
import {
  extractDerivationTeX,
  extractDerivationTermTeX,
  type TeXScope,
} from '@justify/tex-extractor';
import { validateQuery } from '@justify/validator';

export const QUERY_FILENAME = '<query>';

export interface TryBinding {
  id: string;
  texId: string;
  texValue: string;
}

export interface TryConstraint {
  left: string;
  right: string;
}

export interface TryUnboundVariable {
  id: string;
  texId: string;
}

export interface TrySolution {
  bindings: Array<TryBinding>;
  unboundVariables: Array<TryUnboundVariable>;
  constraints: Array<TryConstraint>;
  derivationTeX: string | null;
}

export interface TrySuccess {
  status: 'success';
  solutions: Array<TrySolution>;
}

export interface TryInvalid {
  status: 'invalid';
  diagnostics: Array<Diagnostic>;
}

export interface TryFatal {
  status: 'fatal';
  message: string;
}

export interface TryEmpty {
  status: 'empty';
}

export type TryOutcome = TryEmpty | TryInvalid | TryFatal | TrySuccess;

function termTeX(term: DerivationTerm, scope: TeXScope): string {
  return extractDerivationTermTeX(term, scope);
}

function collectVariableIds(term: DerivationTerm, ids: Set<string>): void {
  if (term.is === 'var') {
    ids.add(term.id);
  } else if (term.is === 'con') {
    for (const argument of term.args) {
      collectVariableIds(argument, ids);
    }
  }
}

function findUnboundVariables(
  solution: QueryResultSolution,
  scope: TeXScope,
): Array<TryUnboundVariable> {
  const referencedIds = new Set<string>();
  for (const { a, b } of solution.constraints.neq) {
    collectVariableIds(a, referencedIds);
    collectVariableIds(b, referencedIds);
  }

  return Object.entries(scope.variables)
    .filter(([id]) => !Object.hasOwn(solution.variables, id) && referencedIds.has(id))
    .map(([id, texId]) => ({ id, texId }));
}

function toTrySolution(
  solution: QueryResultSolution,
  system: System,
  scope: TeXScope,
): TrySolution {
  const bindings: Array<TryBinding> = Object.entries(solution.variables).map(([id, term]) => ({
    id,
    texId: scope.variables[id] ?? id,
    texValue: termTeX(term, scope),
  }));

  const constraints: Array<TryConstraint> = solution.constraints.neq.map(({ a, b }) => ({
    left: termTeX(a, scope),
    right: termTeX(b, scope),
  }));

  const unboundVariables = findUnboundVariables(solution, scope);

  const derivationTeX = solution.derivation
    ? extractDerivationTeX(system, solution.derivation, scope)
    : null;

  return { bindings, unboundVariables, constraints, derivationTeX };
}

export function tryQuery(queryText: string, system: System): TryOutcome {
  if (queryText.trim() === '') {
    return { status: 'empty' };
  }

  const loaded = queryFromJSONString(QUERY_FILENAME, queryText);
  if (!loaded.success) {
    return { status: 'invalid', diagnostics: loaded.diagnostics };
  }

  const diagnostics = validateQuery(loaded.value, system, QUERY_FILENAME);
  if (diagnostics.length > 0) {
    return { status: 'invalid', diagnostics };
  }

  let performed: Array<QueryResultSolution> | string;
  try {
    performed = performQuery(system, loaded.value);
  } catch (error) {
    const message = error instanceof Error ? error.message : `${error}`;
    return { status: 'fatal', message };
  }
  if (typeof performed === 'string') {
    return { status: 'fatal', message: performed };
  }

  const rootScope: TeXScope = {
    variables: loaded.value.variables,
    literals: loaded.value.literals,
  };

  const solutions: Array<TrySolution> = performed.map(solution =>
    toTrySolution(solution, system, rootScope),
  );

  return { status: 'success', solutions };
}
