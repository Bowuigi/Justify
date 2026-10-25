# Justify: Agent Guide

Justify is a suite for inference-rule logical systems. It is an npm-workspaces TypeScript monorepo.

The source of truth for types and validators is `formats/*.jtd.json` (JSON Type Definition). `docs/` is the next authority.

Node runs the `.ts` files directly with type stripping. All imports use explicit `.ts` extensions.

## Toolchain

- Node v24+ runs TS natively. Run the CLI with `npx @justify/cli ...`.
- Format: `npm run fmt`, `npm run fmt:check`.
- Lint and typecheck: `npm run lint`. oxlint is type-aware through `typeAware` and `typeCheck`. There is no separate tsc step. `npm run lint:fix` is available.
- The pre-commit hook (husky, then lint-staged) runs `oxlint` and `oxfmt` on staged files.
- Run `npm run lint` first. Then run `npm run fmt`.

## Codegen

`formats/*.jtd.json` and `packages/validator/modules/*.ts` are hand-written sources. `npm run codegen` (scripts/codegen.sh) generates these files:

- `packages/core/codegen/*-types.d.ts`, `*-validator.ts`, and the barrel `types.d.ts`.
- `packages/validator/codegen/fused.ts`. It fuses the validator `modules/*` passes with awk.

The generated output is committed. Do not edit it by hand. The next codegen run discards the changes. After you edit a JTD schema or a validator module, run `npm run codegen`.

Prerequisites on PATH: `jtd-codegen` (from the jtd-codegen npm package), `deno`, and `awk`.

## Layout

- `formats/*.jtd.json`: the System, Query, and QueryResult schemas. They are authoritative over `docs/`.
- `packages/core`: generated types, JSON to each format conversion, Diagnostic API.
- `packages/cli`: the only input and output code. `main.ts` reads the files, runs the library code, renders diagnostics, and sets exit codes.
- `packages/validator`: semantic validation. Most other packages assume this passes.
- `packages/inferencer`: the microKanren query engine (`mk.ts`) and the rule codegen (`mk-codegen.ts`).
- `packages/tex-extractor`: TeX and KaTeX extraction for System files.
- `packages/markdown-dsl`: the Markdown DSL parsing pipeline, with extension support.
- `attic/`: deprecated and likely outdated. Do not touch it unless explicitly requested.
- `examples/*`: the canonical samples. Use them as integration oracles after semantic changes.
- `docs/*.md`: the human-readable and agent-readable format specifications. Read them before you write examples or tests.

## CLI (from the repo root)

```sh
npx @justify/cli validate system <system.json>
npx @justify/cli validate query <system.json> <query.json>
npx @justify/cli validate query-result <system.json> <query-result.json>
npx @justify/cli infer [-m] <system.json> <query.json>   # -m = machine-readable QueryResult
npx @justify/cli to-tex <system.json> > out.sty
npx @justify/cli from-markdown <system.jtf.md>
```

Stdout carries data only. Every diagnostic, read error, and usage error goes to stderr. The CLI exits 0 only on a clean run. It exits 1 when it prints a diagnostic.

## Testing

- Vitest is setup using projects. The root `vitest.config.ts` points to `packages/*`.
- The custom matchers are defined in `packages/*/test-setup.ts` and typed in `vitest.d.ts`. Use them in new tests if available, and extend them if appropiate.

## Conventions

- File names use `kebab-case`.
- Lint is strict. It enforces `func-style: declaration`, explicit return types, `max-lines: 350`, `max-params: 6`, `noUnusedLocals`, and `consistent-return`.
- Use `import type` for type-only imports. `verbatimModuleSyntax` is on.
- Library code prefers errors as values, preferably using the `Diagnostic` API.
