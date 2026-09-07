# inferencer — Agent Guide

microKanren engine + System→Relation compiler. Manually tested; invariants below are final — preserve them.

## Invariants

- **Fair search**: `mk.ts:appendStream` with swapped `delayed` args; `pullStream`/`takeStream` for simple-complete search.
- **Recursion**: every relation in `mk-codegen.ts:toRelationStore` wrapped in `MK.delay`; `delay` creates `ImmatureStream` (`{is:'delayed', force}`) to avoid infinite eager expansion.
- **Logging**: `MK.wrapLogs(rule, relation, args, goal)` isolates `log:[]` per rule, collects `RuleLog{rule, relation, args, premises}` tree via `mapStream`; `lib.ts:performQuery` reconstructs derivation via `walkLog` + `toIdempotent`.
- **Vars**: `MK.fresh(ids, block)` allocates counter-named `Var{id,counter}`, bumped from `State.counter`; `VarPool` keyed by `id`. `varEq` checks `id` + `counter`.
- **Substitution**: `AssocArray<Var,Term>` + `walk`/`walkAll` + `occursCheck` (recursive) + `extendSubstitution` (throws `OcurrsCheckFailedError`) + `unify`/`unifyArray` (walked, tag/literal equality). `toIdempotent` maps `walkAll` over `subst.data`.
- **Terms**: `Var` | `Con{from,tag,args}` | `Lit{id}`; `convertTermWithPool` resolves `ref` via `pool` or `literals`, throws `UnboundIdentifierError`; `convertTerm` variant takes `variables`/`literals` arrays + counter.
- **Compilation**: `toRelationStore` = `delay(disjN(...rules))` where each rule = `wrapLogs(fresh(vars, conjN(eq(patterns), premises)))` via `relStore[relation]`; `argPool` maps `relData.arguments[ix]` → `relArgs[ix]`; `!` assertions rely on validator.
- **Query**: `lib.ts:performQuery` runs `MK.run(max_results, fresh(query.variables, ...))`, filters idempotent subst to query vars (`initialPool` + counter match), emits `QueryResultSolution{variables, derivation}`.

## Files

- `mk.ts` — core: `Term`, `State`, `Stream`, `Goal`, `eq`/`conjN`/`disjN`/`fresh`/`delay`/`wrapLogs`/`run`.
- `mk-codegen.ts` — `toRelationStore(System) → Record<string,(Term[])=>Goal>`.
- `assoc-array.ts` — immutable `AssocArray<Var,Term>` (`insert`, `lastKey`).
- `lib.ts` — `performQuery(System,Query): Solution[]|string`.
- `main.ts` — CLI (`-m` → JSON `QueryResult`, else colored human output via `node:util styleText`).
