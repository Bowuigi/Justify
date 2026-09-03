# validator — Agent Guide

Fused modular semantic validation for System / Query / QueryResult.

## Adding a pass

Each file in `modules/*.ts` is one pass. Required shape:

```ts
export const managedError = 'XYZ' as const
export type PushedError = { moduleId: typeof managedError, id: string, location: LocationPath, sourceOfTruthLocation: SourceOfTruthPath, /* ... */ }
// any subset of on* handlers (onSynCat, onGrammar, onArgument, onRelation, onRule, onIdentifierMap, onPatterns, onPremise, onQuery, onDerivation, onDerivationTermCon, ...)
// Example:
export function onTermCon(errors: ErrorStack<PushedError>, path: LocationPath, ...): void {}
// called by driver.ts walk; no-ops if not exported
export function formatError(err: PushedError): ModuleErrorInfo {} // id: `${managedError}-${...}`, message, location, sourceOfTruthLocation
```

- `module-common.ts` provides `LocationPath`, `SourceOfTruthPath`, `ModuleErrorInfo`, `ErrorStack`, `highlight`, `displayIterable`.
- Keep `id` namespaced (`CAC-M`, `ODS-...`); `formatError` maps `PushedError` → colored `ModuleErrorInfo`.

## Fusion

`scripts/codegen.sh` aggregates via `awk`: scans `export const managedError` and `export function on*`, generates `codegen/fused.ts` (`PushedError` union, fused `on*` dispatchers, `formatError` switch). Never hand-edit `codegen/fused.ts`.

`driver.ts` walks the System/Query/QueryResult tree depth-first (`onTerm`, `onDerivationTerm`, `onDerivation` + direct `Fused.on*` calls) and maps `Fused.formatError` over collected errors. Add new walk sites there when introducing new tree locations.

## Testing

```ts
import { testSystem, testQuery } from '../testing-common.ts';
// asserts validateSystem/validateQuery return expected ModuleErrorInfo partials
```

Colocate `*.test.ts` beside the module (e.g. `correct-argument-count.test.ts`). Run `deno test --allow-read --allow-env packages/validator/modules/<name>.test.ts`.

## Current passes

`valid-identifiers`, `only-defined-syntax`, `only-defined-relations`, `pattern-match-arguments`, `correct-argument-count`. See `README.md` for NYI list.
