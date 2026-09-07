import type { Derivation, Query, QueryResultSolution, System } from '@justify/core';

import { toRelationStore } from './mk-codegen.ts';
import * as MK from './mk.ts';

export type { RuleLog, Term } from './mk.ts';
export type { Query, System } from '@justify/core';

export function performQuery(system: System, query: Query): Array<QueryResultSolution> | string {
  const systemRelations = toRelationStore(system);

  try {
    let initialPool: MK.VarPool = {};
    const results = MK.run(
      query.max_results,
      MK.fresh(Object.keys(query.variables), pool => {
        initialPool = pool;
        // Catched by validator
        return systemRelations[query.relation]!(
          query.args.map(a => MK.convertTermWithPool(a, pool, Object.keys(query.literals))),
        );
      }),
    );

    return results.map(rslt => {
      if (rslt.log.length !== 1) {
        throw new Error(`Impossible: Log length ${rslt.log.length}`);
      }
      const idempotentSubst = MK.toIdempotent(rslt.subst);
      const variables: QueryResultSolution['variables'] = Object.fromEntries(
        idempotentSubst.data
          .filter(
            ({ key }) => key.id in initialPool && key.counter === initialPool[key.id]?.counter,
          )
          .map(({ key, value }) => [key.id, value] as const),
      );

      // Literally guarded for by the if above
      const derivation: Derivation = MK.walkLog(rslt.log[0]!, idempotentSubst);
      return { variables, derivation };
    });
  } catch (error) {
    if (error instanceof Error) {
      return `Fatal error on execution (${error.name}): ${error.message}`;
    }
    throw error;
  }
}
