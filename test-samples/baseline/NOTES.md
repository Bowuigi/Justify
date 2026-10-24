# Baseline recordings (phase 0)

This directory holds "before" recordings of every CLI invocation in the phase-0 matrix. Each record lives under `test-samples/baseline/before/<name>/` and holds four files:

- `command.txt` — the exact command line
- `stdout.txt` — captured standard output
- `stderr.txt` — captured standard error
- `exit-code.txt` — the process exit code

`styleText` emits no color codes when streams are files, so recorded text is plain. That is correct.

## Sample families and the invalidity level they exercise

Terms use the levels from `test-samples/README.md` and the origins from `docs/common.md` / `packages/core/diagnostics.ts`:

- `*-invalid-not-json`: not valid JSON at all. Exercises the **json-parsing** origin: a `JSON.parse` failure surfaced as a `Diagnostic` with `origin: 'json-parsing'`.
- `invalid-jtd-*`: valid JSON, but violating a JTD schema (missing required field, wrong type, bad fixity, bad count, etc.). Exercises the **json-parsing** origin via JTD validation failures (path location + suggestions as hints).
- `*-bare-minimal`: just enough to pass JTD validation. Exercises the **valid** level (no diagnostics).
- `*-invalid-*`: valid JSON, passes JTD, but triggers a `@justify/validator` module error. Exercises the **validator** origin (e.g. `cac`, `ods`, `odr`, `vi`, `pma`).
- `*-nyi-<pass>`: valid JSON, passes JTD, but triggers a known not-yet-implemented validator error. Exercises the **validator** origin (not-yet-implemented).

System samples pair with no other file. Query and query-result samples are paired with the example system of the same language: `examples/nat/system.json` for nat samples, `examples/stlc-unit/system.json` for stlc samples.

## Parity-relevant behaviors shown by the recordings

### Exit codes per failure kind

| Failure kind | Stream | Exit code |
| --- | --- | --- |
| Usage error (wrong arg count / unknown format) | stderr | 1 |
| JSON parse failure (not-json) | stderr | 1 |
| JTD validation failure | stdout (validator) | 0 (intentional delta, see NOTES below) |
| Validator module error | stdout (validator) | 0 (intentional delta, see NOTES below) |
| Clean run (no diagnostics) | stdout (`All good!` / data) | 0 |

### Which stream each message goes to

- All validator validation messages go to **stdout** today (this is an intentional delta the new CLI changes: every diagnostic goes to stderr).
- All JSON parse failures, usage errors, and fatal read errors go to **stderr**.
- `tex-extractor` TeX output goes to **stdout**; it writes nothing to stderr on success.
- `inferencer` solution output (or `-m` JSON) goes to **stdout**; engine error strings go to **stderr**.
- `markdown-dsl` prints an `inspect` dump of its result record to **stdout**.

### Order the validator parses its two input files

For `query` and `query-result`, the validator parses the **system file first**, then the query/query-result file. Both files are parsed before any validation runs. If either parse fails (returns null), the run exits 1 without validating.

### `tex-extractor` on a parseable but semantically invalid system

`tex-extractor` only parses the system (JTD validation) — it does **not** run the semantic validator. On a parseable but semantically invalid system (e.g. `system-invalid-vi.jtf.json`) it exits 0 and emits TeX bindings to stdout derived from the parsed structure, with nothing on stderr.

### Intentional deltas (recorded upfront in PURIFICATION_PLAN.md)

1. The new CLI exits 1 when validation reports errors; the old validator CLI exits 0 in that case.
2. Every diagnostic goes to stderr in the new CLI; the old validator CLI printed validation errors to stdout.
3. Diagnostics render richer: hints and related locations that the old CLIs dropped.
4. `from-markdown` prints `JSON.stringify(extracted)` to stdout; the old markdown-dsl CLI printed an `inspect` dump of its result record.
5. Subcommand names change; the old CLIs disappear. The mapping lives in the phase-5 steps.
6. `markdown-dsl` stdout record shape changed: the `errors` field (plain `{ message, provenance }` entries) is replaced by a `diagnostics` field of `Diagnostic` objects (each with `message`, `hints`, `relatedLocations`), as `PipelineError` was removed and `runPipeline` now emits core diagnostics.
7. `tex-extractor` stack traces now reference `packages/tex-extractor/lib.ts` (and shifted line numbers) instead of `main.ts`, because `extractTeX` and its helpers moved there in phase 4. The error message text, exit codes, and stdout output are unchanged; only the file:line metadata in thrown stack traces differs.

### Sample-family coverage in `before/`

- `validator--system--<system-sample>`: every `test-samples/system-*.jtf.json`.
- `validator--query--<query-sample>`: every `test-samples/query-*.jtf.json`, paired with its example system.
- `validator--query-result--<query-result-sample>`: every `test-samples/query-result-*.jtf.json`, paired with `examples/nat/system.json`.
- `inferencer--<query-sample>` and `inferencer--<query-sample>--machine-readable`: every valid query sample, with and without `-m`.
- `tex-extractor--<system-sample>`: every `test-samples/system-*.jtf.json`.
- `markdown-dsl--example-<nat|stlc-unit>-system`: both `packages/markdown-dsl/example-*.jtf.md` files.
- Usage-error records: each tool with a wrong argument count, plus the validator with an unknown format name.

## Phase 5 — merged CLI (`after-cli/`)

`after-cli/` mirrors the `before/` record names one-for-one, so each directory is the direct counterpart of the same-named directory in `before/`. The `command.txt` inside each record holds the new invocation:

- `validator system` → `node packages/cli/main.ts validate system`
- `validator query` → `node packages/cli/main.ts validate query`
- `validator query-result` → `node packages/cli/main.ts validate query-result`
- `inferencer` → `node packages/cli/main.ts infer`
- `tex-extractor` → `node packages/cli/main.ts to-tex`
- `markdown-dsl` → `node packages/cli/main.ts from-markdown`

Usage-error records keep their old names but use the equivalent new-CLI invocation (for example `inferencer--usage--no-args` runs `node packages/cli/main.ts infer`).

### What is byte-identical

- Every `infer` stdout file, with and without `-m` (12 records).
- Every `to-tex` stdout file (all system samples, valid and invalid).
- Every clean `validate` stdout file: `All good!`, exit 0.
- All clean-run stdout and stderr files.

### Why the remaining records differ

1. **Usage text changed** (all `*-usage-*` records). The subcommands and option spelling are the phase-5 grammar (`validate ...`, `infer [-m] ...`, `to-tex`, `from-markdown`), and the usage lines name `packages/cli/main.ts`. Exit code stays 1 and the message stays on stderr. This is intentional delta 5.
2. **`from-markdown` stdout is now data.** The two `markdown-dsl--example-*` records print `JSON.stringify(extracted)` instead of the old `inspect` dump of the pipeline result. This is intentional deltas 4 and 6.
3. **Semantic validator diagnostics moved to stderr and exit 1.** Every `validator` record whose old stdout carried validation errors now writes them to stderr and exits 1; the diagnostic text itself is unchanged apart from item 5. This is intentional deltas 1 and 2.
4. **All diagnostics use the shared renderer.** JSON parse failures now render as `source: message` instead of `source, Name: message`. JTD suggestions now render as `Did you mean any of those: ...` hints instead of the old `Suggestions: ...` line. Each diagnostic is followed by a blank line. This is intentional delta 3 (richer diagnostics).
5. **`displayIterable` no longer emits an extra separator.** The old renderer produced `equal, add,  or multiply` and `n,  or m`; core now produces `equal, add or multiply` and `n or m`. The fix landed in phase 2 (`bdf0810`) and is part of the unified core RichText rendering.
6. **`to-tex` parse failures use the renderer too.** The JTD suggestion lines change as in item 4, and JSON parse failures change as in item 4. Exit code stays 1.
7. **`to-tex` crashes keep their stack traces but with new frames.** For `system-invalid-pma` and `system-invalid-vi-ods-pma-odr`, the crash is identical in kind and exit code; only file paths/line numbers move to `packages/tex-extractor/lib.ts` and gain `packages/cli/main.ts` frames. This extends phase-4 delta 7.
8. **`to-tex` still does not run the semantic validator.** Semantically invalid but JTD-valid systems still emit TeX to stdout and exit 0, exactly as before.
