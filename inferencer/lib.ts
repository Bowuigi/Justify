import { Query, System } from '../formats/driver.ts';
import * as MK from './mk.ts';
import type { RuleLog, Term } from './mk.ts';
import { toRelationStore } from './mkCodegen.ts';

export { Query, System, RuleLog, Term };

export function performQuery(system: System, query: Query): Array<RuleLog> | string {
  const systemRelations = toRelationStore(system);

  try {
    const results = MK.run(
      query.max_results,
      MK.fresh(Object.keys(query.variables), pool =>
        systemRelations[query.relation](
          query.args.map(a => MK.convertTermWithPool(a, pool, Object.keys(query.literals)))
        )
      )
    );

    return results.map(rslt => {
      if (rslt.log.length !== 1) {
        throw new Error(`Impossible: Log length ${rslt.log.length}`);
      }
      return MK.walkLog(rslt.log[0], MK.toIdempotent(rslt.subst));
    });
  } catch (err) {
    if (err instanceof Error) {
      return (`Fatal error on execution (${err.name}):\n` + err.message);
    } else {
      throw err;
    }
  }
}

