# Justify — Agent Guide

Suite for inference-rule logical systems. npm-workspaces TS monorepo Source of truth for types/validators is `formats/*.jtd.json` (JSON Type Definition), then `docs/` Everything runs as `.ts` directly via Node's type stripping — imports use explicit `.ts` extensions

## Toolchain

- Node v24+ runs TS natively: `node packages/validator/main.ts system <file>` (works for all package CLIs)
- Format: `npm run fmt`, `npm run fmt:check`
- Lint + typecheck: `npm run lint` (oxlint is type-aware via `typeAware`/`typeCheck`; there is **no separate tsc step**). `npm run lint:fix` available
- Pre-commit hook (husky → lint-staged) runs `oxlint` + `oxfmt` on staged files
- Verification order: `npm run lint` then `npm run fmt`

## Codegen

`formats/*.jtd.json` and `packages/validator/modules/*.ts` are hand-written sources. `npm run codegen` (scripts/codegen.sh) generates into:

- `packages/core/codegen/*-types.d.ts`, `*-validator.ts`, barrel `types.d.ts`
- `packages/validator/codegen/fused.ts` — fuses the validator `modules/*` passes via awk

Generated output is **committed** but never hand-edited — changes are lost on the next codegen run. After editing a JTD schema or a validator module, run `npm run codegen`

Prereqs on PATH: `jtd-codegen` (from jtd-codegen npm package) and `deno`, plus `awk`

## Layout

- `formats/*.jtd.json` — System/Query/QueryResult schemas, authoritative over `docs/`
- `packages/core` — generated types + JTD validators; `lib.ts` = `parseSystem`/`parseQuery`/`parseQueryResult`
- `packages/validator` — semantic validation: modular passes in `modules/*`, fused into `codegen/fused.ts`, orchestrated by `driver.ts`. CLI: `main.ts`
- `packages/inferencer` — microKanren query engine (`mk.ts`), CLI `main.ts`, codegen for rules (`mk-codegen.ts`)
- `packages/tex-extractor` — TeX/KaTeX output
- `packages/remark-plugin` — WIP, NOT usable
- `attic/` — deprecated, likely outdated; do not extend
- `examples/nat`, `examples/stlc-unit` — canonical samples; use as integration oracles after semantic changes
- `docs/*.md` — human (and agent) readable format specs. Read those before writing examples or tests

## CLI (from repo root)

```sh
node packages/validator/main.ts system <system.json>
node packages/validator/main.ts query <system.json> <query.json>
node packages/validator/main.ts query-result <system.json> <query-result.json>
node packages/inferencer/main.ts [-m] <system.json> <query.json>   # -m = machine-readable QueryResult
node packages/tex-extractor/main.ts <system.json> > out.sty
```

## Testing

- Vitest, but only the `validator` project is wired up (root `vitest.config.ts` → `packages/validator`)
- Custom matchers defined in `packages/validator/test-setup.ts` (`toBeAValidSystem`, `toBeHaveAValidQuery`, `toBeASystemReturningValidationErrors`, ...) and typed in `vitest.d.ts`. Use them in new validator tests
- **There are currently no test files** — `npm test` exits 1 with "No test files found". Colocate new `*.test.ts` under `packages/validator/modules/` (linked to `@justify/core` + `@justify/validator` TS sources)
- Focused run: `npx vitest run packages/validator/modules/<file>.test.ts`

## Conventions

- Files: `kebab-case`
- Lint is strict: `func-style: declaration`, explicit return types, `max-lines: 350`, `max-params: 6`, `noUnusedLocals`, `consistent-return`. `main.ts`/`lib.ts` overrides allow `console`
- `import type` for type-only imports; `verbatimModuleSyntax`
- CLI error style (`main.ts`): `null` + `console.error` + `process.exitCode = 1`; library code prefers errors-as-values (`Result` type)
