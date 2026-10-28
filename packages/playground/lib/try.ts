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

export interface TrySolution {
  bindings: Array<TryBinding>;
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

  const solutions: Array<TrySolution> = performed.map(solution => {
    const bindings: Array<TryBinding> = Object.entries(solution.variables).map(([id, term]) => ({
      id,
      texId: rootScope.variables[id] ?? id,
      texValue: termTeX(term, rootScope),
    }));

    const derivationTeX = solution.derivation
      ? extractDerivationTeX(system, solution.derivation, rootScope)
      : null;

    return { bindings, derivationTeX };
  });

  return { status: 'success', solutions };
}
