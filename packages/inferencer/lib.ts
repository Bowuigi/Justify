import type { Derivation, Query, QueryResultSolution, System } from '@justify/core';
import * as MK from './mk.ts';
import type { RuleLog, Term } from './mk.ts';
import { toRelationStore } from './mkCodegen.ts';

export type { Query, RuleLog, System, Term };

export function performQuery(system: System, query: Query): Array<QueryResultSolution> | string {
  const systemRelations = toRelationStore(system);
  let initialPool: MK.VarPool;

  try {
    const results = MK.run(
      query.max_results,
      MK.fresh(Object.keys(query.variables), (pool) => {
        initialPool = pool;
        // Catched by validator
        // deno-lint-ignore no-non-null-assertion
        return systemRelations[query.relation]!(
          query.args.map((a) => MK.convertTermWithPool(a, pool, Object.keys(query.literals)))
        );
      })
    );

    return results.map((rslt) => {
      if (rslt.log.length !== 1) {
        throw new Error(`Impossible: Log length ${rslt.log.length}`);
      }
      const idempotentSubst = MK.toIdempotent(rslt.subst);
      const variables: QueryResultSolution['variables'] = Object.fromEntries(
        idempotentSubst.data.filter(({ key }) =>
          key.id in initialPool && key.counter === initialPool[key.id]?.counter
        ).map(({ key, value }) => [key.id, value] as const)
      );

      // Literally guarded for by the if above
      // deno-lint-ignore no-non-null-assertion
      const derivation: Derivation = MK.walkLog(rslt.log[0]!, idempotentSubst);
      return { variables, derivation };
    });
  } catch (err) {
    if (err instanceof Error) {
      return (`Fatal error on execution (${err.name}):\n` + err.message);
    } else {
      throw err;
    }
  }
}
