# Justify — Agent Guide

Suite for inference-rule logical systems. Deno workspace (`deno.json` → `packages/*`), JSR, strict TS. Source of truth is `formats/*.jtd.json`.

## Layout

```
formats/*.jtd.json          # System / Query / QueryResult schemas (JTD)
packages/core/              # Generated types + JTD validators, parseSystem/parseQuery/parseQueryResult
packages/validator/         # Semantic validation (fused modular passes) → AGENTS.md
packages/inferencer/        # microKanren query engine → AGENTS.md
packages/tex-extractor/     # `extractTeX` → .sty
packages/remark-plugin/     # remark extension generating System files
docs/System.md, Query.md, QueryResult.md, common.md
examples/nat/, stlc-unit/   # Canonical real-world samples — use as integration oracles
scripts/codegen.sh          # Codegen orchestrator
attic/                      # Deprecated, likely outdated — do not extend
```

## Workflow

1. If you edit `formats/*.jtd.json`: run `sh scripts/codegen.sh` then `deno fmt`. Never hand-edit `packages/core/codegen/*` or `packages/validator/codegen/fused.ts` — changes are lost on next codegen.
2. Edit `packages/*` source (`mod.ts`/`lib.ts`/`main.ts`/`modules/*`).
3. Fix lint/fmt for edited files: `deno lint`, `deno fmt`. Config scope is `packages/*` only (`fmt` excludes `**/*.md`); still run on your edited files only.
4. Typecheck: `deno check`.
5. Test colocated: `deno test --allow-read --allow-env packages/<pkg>/**/*.test.ts`. Validate samples: run validator + inferencer CLIs against `examples/*`.

## Commands

No `deno task` — use direct subcommands:

```sh
sh scripts/codegen.sh
deno lint
deno fmt                  # --check in CI
deno check packages/*/mod.ts packages/*/lib.ts packages/*/main.ts
deno test --allow-read --allow-env packages/validator/modules/correct-argument-count.test.ts
```

Per-package CLIs (from repo root, `bun`/`node` also supported):

```sh
# validator — see packages/validator/README.md
deno run --allow-read --allow-env packages/validator/main.ts system <system.json>
deno run --allow-read --allow-env packages/validator/main.ts query <system.json> <query.json>
deno run --allow-read --allow-env packages/validator/main.ts query-result <system.json> <query-result.json>

# inferencer — see packages/inferencer/README.md
deno run --allow-read --allow-env packages/inferencer/main.ts [-m] <system.json> <query.json>

# tex-extractor — see packages/tex-extractor/README.md
deno run --allow-read --allow-env packages/tex-extractor/main.ts <system.json> > out.sty
```

Prerequisites: Deno, `jtd-codegen`, `awk`.

## Conventions

- Identifiers: `snake_case` enforced (`^[a-z][a-z0-9_]*$`). Files: `kebab-case`. TeX macros: `PascalCase` via `snakeToCamel`.
- Imports: `import type` where possible; `// deno-lint-ignore no-external-import` before `node:*` (`node:fs/promises`, `node:process`, `node:util`).
- Format: 2-space, singleQuote, 100 width, `semiColons:true`, `trailingCommas:never` (`deno.json` `fmt`).
- Lint: `recommended` + `jsr` + explicit rules (`explicit-function-return-type`, `no-console`, `eqeqeq`, etc.; `no-unused-vars` excluded). `compilerOptions` strict, `noUnusedLocals:true`.
- Error handling: `main.ts` CLIs only return `null` + `console.error` + `process.exitCode=1` for user errors. All other code uses errors-as-values or throws custom errors — prefer errors-as-values.
- Generated output (`packages/core/codegen/*`, `packages/validator/codegen/fused.ts`) is BSD where permissible else public domain; `packages/tex-extractor/latex-compat.sty` is 0BSD.

## Packages

- **core** — thin `parseFile` wrapper (`node:fs/promises.readFile` → `JSON.parse` → JTD validator) + barrel `codegen/types.d.ts`. See `packages/core/README.md`.
- **validator** — fused modular passes. Detail behind pointer → `packages/validator/AGENTS.md`.
- **inferencer** — microKanren engine with final invariants. Detail behind pointer → `packages/inferencer/AGENTS.md`.
- **tex-extractor** — `main.ts:extractTeX` + `latex-compat.sty` (`jyRules` env). See `packages/tex-extractor/README.md`.
- **remark-plugin** — WIP, not usable yet. Literate `justify-syntax`/`justify-relation`/`justify-rule` fences. See `packages/remark-plugin/README.md` + `example-*.jtf.md`.

## Testing

- Harness: `node:test` + `node:assert` via `packages/validator/testing-common.ts` (`testSystem`/`testQuery`). One existing test: `packages/validator/modules/correct-argument-count.test.ts`.
- New tests: colocate `*.test.ts` beside implementation in each package.
- Samples `examples/nat` and `examples/stlc-unit` are the integration oracles — validate and run inferencer (human and `-m` JSON) against them after semantic changes.

## Reference

- `deno.json` — workspace, lint/fmt/compilerOptions, `imports`.
- `scripts/codegen.sh` — full codegen logic (`jtd-codegen` → `*-types.d.ts`, `jsr:@bowuigi/jtd-validator-generator` → `*-validator.ts`, `awk` barrel + fused).
- `docs/common.md` + `docs/System.md` + `docs/Query.md` + `docs/QueryResult.md` — format specs.
