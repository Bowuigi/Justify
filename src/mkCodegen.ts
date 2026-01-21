import * as MK from './mk';
import { type SSystem } from '../formats/system';

/*
Every relation in inference-rule style
```
[[ Relation relationName(args...) ]]

premise1(args...) ...
------------------------- [Rule1]
relationName(match1, ...)

...
```

Can be represented in miniKanren like so:
```
defrel relationName(args...) {
  disj {
    [Rule1] fresh (vars...) $ conj {
      arg1 == match1
      ...
      premise1(args...)
      ...
    }
    ...
  }
}
```
*/
export function toRelationStore(system: SSystem): Record<string, (relArgs: Array<MK.Term>) => MK.Goal> {
  let relStore: Record<string, (relArgs: Array<MK.Term>) => MK.Goal> = {};
  for (const [relName, relData] of Object.entries(system.relations)) {
    relStore[relName] = (relArgs: Array<MK.Term>) => {
      const argPool = Object.fromEntries(relData.arguments.map((arg, ix) => [arg.id, relArgs[ix]]));
      return MK.delay(
        MK.disjN(
          ...relData.rules.map(rule =>
            MK.fresh(Object.keys(rule.variables), pool =>
              MK.conjN(
                ...Object.entries(rule.patterns).map(
                  ([argVar, poolValue]) => MK.eq(argPool[argVar], MK.convertTermWithPool(poolValue, pool, Object.keys(rule.literals)))
                ),
                ...rule.premises.map(
                  ({ relation, args }) => relStore[relation](args.map(a => MK.convertTermWithPool(a, pool, Object.keys(rule.literals))))
                )
              ) // conjN
            ) // fresh
          ) // rules.map
        ) // disjN
      ) // delay
    } // relStore[relName]
  } // for
  return relStore;
}
