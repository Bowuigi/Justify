# Purification plan

Goal: make almost every Justify package pure. Library code stops reading files and printing to the console. All input/output moves to one new CLI package. All error reporting moves onto core's `Diagnostic` type, so the playground can consume diagnostics as data and render them as HTML.

Phases 0 to 6. One phase per session. Every phase ends with `npm run lint` and `npm run fmt` passing.

## Ground rules

- `EXTEND-*.md` and `FIX-*.md` in the repo root are draft plans. Leave them alone.
- No new test files. No npm bin wiring. The CLI runs as `npx @justify/cli ...` like every other package.
- `fromJSONString` stays in `packages/core/lib.ts` as an internal helper for the three `*FromJSONString` functions. It loses its export in phase 6.
- The old `main.ts` CLIs keep working until phase 6 deletes them. A phase must not break them unless explicitly commanded (use the question tool as required).

## Parity contract

Parity means: same stdout data, same stderr information, same exit codes, before and after. Known intentional deltas are listed here. Any new delta a phase introduces goes into `test-samples/baseline/NOTES.md` (see phase 0) in the same session.

Intentional deltas, decided upfront:

- The new CLI exits 1 when validation reports errors. The old validator CLI exits 0 in that case.
- Every diagnostic goes to stderr. The old validator CLI printed validation errors to stdout.
- Diagnostics render richer: hints and related locations that the old CLIs dropped.
- `from-markdown` prints `JSON.stringify(extracted)` to stdout. The old markdown-dsl CLI printed an `inspect` dump of its result record.
- Subcommand names change. The old CLIs disappear. The mapping lives in the phase 5 steps.

## Phase 0 — Record the baseline

Purpose: capture what each CLI does today. Later phases compare their recordings against this baseline. That comparison is the testing method for this plan.

Steps:

1. Read `docs/common.md`, `docs/System.md`, `docs/Query.md`, `docs/QueryResult.md`, and `test-samples/README.md`. The recordings describe format errors, so the recorder must speak the format's vocabulary.
2. Create `test-samples/baseline/`. Every invocation record lives in its own directory under a "when" folder: `test-samples/baseline/<when>/<name>/`. Each record directory holds four files: `command.txt` (the exact command line), `stdout.txt`, `stderr.txt`, and `exit-code.txt`. Give each `<name>` the tool and the samples involved, for example `validator--system--system-invalid-vi`.
3. Record the "before" set into `test-samples/baseline/before/`. Record this matrix:
   - `validator system` on every `test-samples/system-*.jtf.json`.
   - `validator query` on every query sample, paired with the example system of the same language (`examples/nat/system.json` or `examples/stlc-unit/system.json`).
   - `validator query-result` on every query-result sample, same pairing rule.
   - `inferencer` on every valid query sample with its example system, with and without `-m`.
   - `tex-extractor` on every system sample.
   - `markdown-dsl` on both `packages/markdown-dsl/example-*.jtf.md` files.
   - Usage errors: each tool with a wrong argument count, and the validator with an unknown format name.
4. Write `test-samples/baseline/NOTES.md`. For each sample family in `test-samples/`, state which invalidity level it exercises, in the terms of `docs/`. Then state every parity-relevant behavior the recordings show: exit codes per failure kind, which stream each message goes to, the order in which the validator parses its two input files, and what `tex-extractor` does with a parseable but semantically invalid system.

Note: `styleText` emits no color codes when the streams are files. The recorded files are plain text. That is correct.

Completion criteria:

- Every invocation in the matrix has a record directory with all four files.
- `NOTES.md` covers every sample family and states the exit-code and stream behavior of every tool.
- Re-running one recorded command reproduces the same three outputs.

## Phase 1 — Core pure API

Purpose: give consumers the pure parse functions.

Steps, all in `packages/core/lib.ts`:

1. Add `systemFromJSONString`, `queryFromJSONString`, and `queryResultFromJSONString`. Each takes `(filename, jsonString)` and returns `LoadResult<System>`, `LoadResult<Query>`, and `LoadResult<QueryResult>`. Each delegates to the internal `fromJSONString` helper with its validator.
2. Export the `LoadResult` type.
3. Re-export diagnostics: `export * from './diagnostics.ts'` in `lib.ts`. There are no name collisions.
4. Keep `parseSystem`, `parseQuery`, `parseQueryResult`, and the `fromJSONString` export. They leave in later phases.

Completion criteria:

- `npm run lint` and `npm run fmt` pass.
- A short `node -e` run calls each new function on one valid and one invalid sample and prints the expected `LoadResult` shape for both outcomes.
- All recorded CLIs still produce their "before" outputs.

## Phase 2 — Validator unification

Purpose: one RichText shape and one public error type across core and validator.

Steps:

1. In `packages/validator/module-common.ts`, delete the local `RichText`, `RichTextPart`, `highlightCorrect`, `highlightWrong`, and `displayIterable`. Re-export the core versions instead. `highlightError` replaces `highlightWrong`.
2. In the five `packages/validator/modules/*.ts` files, rename every `C.highlightWrong` call to `C.highlightError` (7 call sites).
3. `packages/validator/driver.ts` stays as it is. It keeps returning `ModuleErrorInfo`. Modules keep emitting `ModuleErrorInfo`; their typed location paths are compile-time safety for module authors.
4. Rewrite `packages/validator/lib.ts`. It calls the driver and converts each `ModuleErrorInfo` to a `Diagnostic`:
   - `id` becomes `code`.
   - `origin` is `'validator'`.
   - `source` is the new `filename` parameter.
   - `message` and `hints` pass through.
   - `location` becomes a related location labeled `In` with a path location.
   - `sourceOfTruthLocation`, when not null, becomes a related location labeled `Conflicts with`. The public functions gain the `filename` parameter: `validateSystem(system, filename)`, `validateQuery(query, system, filename)`, and `validateQueryResult(queryResult, system, filename)`. Each returns `Array<Diagnostic>`. `ModuleErrorInfo` and the validator's RichText types leave the public surface.
5. Update `packages/validator/test-setup.ts`. The custom matchers call the lib.ts functions and take `Partial<Diagnostic>` instead of `Partial<ModuleErrorInfo>`.

Completion criteria:

- `npm run lint` and `npm run fmt` pass.
- `packages/validator/main.ts` compiles untouched. It still uses `driver.ts`.
- Re-record every `validator` invocation into `test-samples/baseline/after-phase-2/`. `diff -r` against `before/` shows no changes in the four recorded files.

## Phase 3 — markdown-dsl diagnostics

Purpose: markdown-dsl emits core diagnostics. `PipelineError` disappears.

Steps:

1. In `packages/markdown-dsl/mod.ts`, change `runPipeline` to take a `filename` parameter and to return `{ extracted: System, diagnostics: Array<Diagnostic> }`. The `errors` field and the `PipelineError` type are deleted.
2. Error blocks carry a `Diagnostic` with `origin: 'markdown-dsl'` and `source` filled from `filename`. Each error block's `provenance` becomes a related location labeled `In` with a line-span location.
3. In `packages/markdown-dsl/extensions.ts`, convert every error site (about 10). JTD validation failures become diagnostics with a path location and the suggestions as hints. Peggy syntax errors keep their formatted message text.
4. Update the call site in `packages/markdown-dsl/main.ts`. It still prints an `inspect` dump for now. It dies in phase 6.

Completion criteria:

- `npm run lint` and `npm run fmt` pass.
- Re-record the `markdown-dsl` invocations into `test-samples/baseline/after-phase-3/`. Compare with `before/`. Every difference is the new record shape or the richer diagnostics. Add each difference to `NOTES.md` as an intentional delta.

## Phase 4 — tex-extractor library

Purpose: make `extractTeX` importable by the new CLI.

Steps:

1. Create `packages/tex-extractor/lib.ts`. Move `extractTeX` there and export it. Keep its helpers unexported.
2. Point `packages/tex-extractor/package.json` `exports` at `./lib.ts`.
3. Update `packages/tex-extractor/main.ts` to import `extractTeX` from `lib.ts`. Its behavior does not change.

Completion criteria:

- `npm run lint` and `npm run fmt` pass.
- Re-record the `tex-extractor` invocations. `diff -r` against `before/` shows no changes.

## Phase 5 — The merged CLI

Purpose: one CLI with feature parity. Old CLIs still exist; they leave in phase 6.

Steps:

1. Create `packages/cli/` with `package.json` (name `@justify/cli`, `type: module`, no dependencies listed, matching the other packages) and `main.ts`.
2. Implement this grammar with a hand-rolled argv switch. No argument-parsing library:

   ```sh
   npx @justify/cli validate system <file>
   npx @justify/cli validate query <system-file> <query-file>
   npx @justify/cli validate query-result <system-file> <query-result-file>
   npx @justify/cli infer [-m] <system-file> <query-file>
   npx @justify/cli to-tex <system-file>
   npx @justify/cli from-markdown <file.jtf.md>
   ```

3. Write one shared diagnostic renderer in `main.ts`. Format for each diagnostic: a `source: message` line, then each related location as `  <label> <location>`, then each hint as `  <hint>`. Render core's RichText with `styleText`: green for `correct` parts, red for `error` parts.
4. Each subcommand reads its files with `readFile` in a try/catch. A read error prints to stderr and exits 1.
5. Stream rules: every diagnostic, read error, and usage error goes to stderr. Stdout carries only data: `All good!` on a clean validate run, `infer` solutions or `-m` JSON, `to-tex` TeX content, and `from-markdown` `JSON.stringify(extracted)`. Exit 1 when any diagnostic was printed. Exit 0 on clean runs only.
6. `infer` uses `performQuery` from `@justify/inferencer`. `to-tex` uses `extractTeX` from `@justify/tex-extractor`. `from-markdown` uses `runPipeline` plus the four extensions from `@justify/markdown-dsl`. The three `validate` paths use the phase 1 parse functions and the phase 2 validator functions.

Completion criteria:

- `npm run lint` and `npm run fmt` pass.
- Record the full matrix from phase 0 through the new CLI into `test-samples/baseline/after-cli/`. Use a name that maps each record to its `before/` counterpart.
- `diff -r` every mapped pair. Stdout data is byte-identical where the pipeline produces the same data (valid `infer` runs, `to-tex` output, `All good!`).
- Every remaining difference appears in `NOTES.md` with a reason, and matches the intentional deltas above.

## Phase 6 — Delete and document

Purpose: remove the old CLIs and the impure core API. Point every document at the new world.

Steps:

1. Delete `packages/validator/main.ts`, `packages/inferencer/main.ts`, `packages/tex-extractor/main.ts`, and `packages/markdown-dsl/main.ts`.
2. In `packages/core/lib.ts`, delete `parseSystem`, `parseQuery`, `parseQueryResult`, `parseFile`, and the `node:fs` import. Un-export `fromJSONString`; it stays as an internal helper.
3. Update `AGENTS.md`: the CLI section shows the new subcommands, the `packages/core` line describes the pure parse functions, the layout line mentions `packages/cli`, and the testing note describes `test-setup.ts` matchers on `Diagnostic`, use the `simple-english` and `writing-for-agents` skills, and rewrite the whole `AGENTS.md` properly.
4. Update the usage sections of `packages/validator/README.md`, `packages/inferencer/README.md`, `packages/tex-extractor/README.md`, and `packages/markdown-dsl/README.md`. Each shows the new CLI command that replaces its tool.
5. Run the full matrix once more through the new CLI into `test-samples/baseline/final/`. Diff against `after-cli/`; expect no changes.

Completion criteria:

- `npm run lint` and `npm run fmt` pass.
- A repository-wide search for `parseSystem`, `parseQuery`, and `parseQueryResult` finds hits only in this plan.
- A repository-wide search for `node:fs` finds hits only in this plan and the CLI package.
- `final/` and `after-cli/` are identical under `diff -r`.
- Every command shown in `AGENTS.md` and the five READMEs runs and exits 0 on a valid example.
