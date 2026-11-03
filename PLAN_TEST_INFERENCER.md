# Inferencer regression test plan

## Final goal

Build a regression test suite for the inferencer package. The suite will protect the current behavior of `mk.ts` before later core changes begin.

Most tests will cover `mk.ts` directly. Smaller suites will cover `assoc-array.ts` and the public `performQuery` path. The `mk-codegen.ts` behavior will be tested through `performQuery` integration tests.

The suite will use valid systems and queries from the format specifications. It will not change production behavior or expose private helpers only for testing.

## Relevant context

### Package structure

The relevant files have these roles:

- `packages/inferencer/mk.ts` contains the MicroKanren-style core.
- `packages/inferencer/assoc-array.ts` contains the substitution data structure.
- `packages/inferencer/mk-codegen.ts` converts system relations into core goals.
- `packages/inferencer/lib.ts` provides the public `performQuery` function.
- `packages/inferencer/vitest.config.ts` defines the `inferencer` Vitest project.
- `packages/inferencer/tests/` will contain the new tests.

The inferencer package does not currently contain test files.

### Core API

The tests will use only exported functions from `mk.ts`:

- `convertTermWithPool`
- `toIdempotent`
- `walkLog`
- `fresh`
- `wrapLogs`
- `delay`
- `run`
- `eq`
- `disjN`
- `conjN`

The tests will not import or expose `unify`, `walk`, `occursCheck`, or other private functions.

`AssocArray` is exported from `assoc-array.ts`. The tests will cover its public methods directly.

### Public query API

`performQuery` accepts a `System` and a `Query`. It returns either an array of query solutions or a fatal error string.

Its integration path covers these boundaries:

- System relations become core goals.
- Rule variables and literals become core terms.
- Patterns unify relation arguments.
- Premises call other relations.
- Query variables appear in the final result.
- Internal rule variables do not appear in the final result.
- Rule logs become derivation trees.

### Reference material

The executor must read these files before writing fixtures:

- `docs/System.md` defines systems, relations, rules, patterns, and premises.
- `docs/Query.md` defines queries, scopes, arguments, and result limits.
- `docs/QueryResult.md` defines solutions and derivation trees.
- `docs/common.md` defines terms, variables, literals, and identifiers.
- `formats/system.jtd.json` is the authoritative system schema.
- `formats/query.jtd.json` is the authoritative query schema.
- `formats/query-result.jtd.json` is the authoritative result schema.

The canonical integration inputs are:

- `examples/nat/system.json`
- `examples/nat/query-equal.json`
- `examples/nat/query-multiply.json`
- `examples/stlc-unit/system.json`
- `examples/stlc-unit/query-simple.json`
- `examples/stlc-unit/query-apply.json`
- `examples/stlc-unit/query-member.json`
- `examples/stlc-unit/query-judge.json`

### Test expectations

The suite will follow these decisions:

- Small outputs will use inline Vitest snapshots.
- Large outputs will use targeted assertions.
- Large derivation trees will not use full snapshots.
- Controlled tests will lock the current solution order.
- Broad tests will not require an order that the format does not define.
- Small snapshots may lock exact counter values.
- Broad tests will assert counter identity, equality, and uniqueness instead.
- Error tests will assert the error name and semantic message details.
- Error tests will not lock the complete formatted message.
- Integration tests will call `performQuery` in process.
- Integration tests will not run the CLI as a subprocess.
- Dedicated minimal fixtures will cover focused cases.
- All six canonical query examples will receive integration smoke tests.
- The suite will not contain dedicated performance tests.
- The suite will not contain dedicated termination tests.
- Vitest's default timeout will detect hangs during test runs.
- Coverage reports will guide the work but will not define a numeric threshold.

### Expected test files

The executor can adjust this layout when a smaller or clearer arrangement works better.

```text
packages/inferencer/tests/
  helpers.ts
  assoc-array.test.ts
  mk-terms.test.ts
  mk-search.test.ts
  mk-logs.test.ts
  perform-query.test.ts
  canonical-examples.test.ts
```

Use typed constants for small dedicated fixtures. Load canonical JSON files from disk with their repository paths.

### Commands

Run the inferencer project tests with:

```sh
npm test -- --project inferencer
```

Run coverage with:

```sh
npm run test:coverage -- --project inferencer
```

Run the complete repository test suite with:

```sh
npm test
```

Follow the repository quality gates in this order:

```sh
npm run lint
npm run fmt
npm run fmt:check
```

## Methodology

1. Read this plan, `AGENTS.md`, and the relevant format documents.
2. Implement only the requested phase. Assume that all earlier phases are complete.
3. Translate the phase criteria into named test cases before adding shared helpers or fixtures.
4. Derive expected behavior from the format documents.
5. Use the current implementation only for behavior that the documents do not define.
6. Put experiments in `/tmp/pi-experiments/inferencer-tests` when possible.
7. Remove experiment files as soon as the results are recorded.
8. Add the test code and the minimum fixtures needed by the test cases.
9. Run the focused test file and correct each failure.
10. Repeat the test and correction cycle until every phase criterion passes.
11. Run the full inferencer project tests after the focused tests pass.
12. Run coverage and inspect uncovered behavior in the inferencer package.
13. Review the diff for test-only changes and accidental generated files.
14. Present the phase changes and criteria results to the user.

The tests must describe current behavior without changing it. If a test exposes an incorrect production behavior, stop and report the problem to the user. Do not change production code without explicit approval.

## Plan phases

### Phase 1: Test the data structures, terms, and unification

#### Goal of phase 1

Establish the test structure and cover the foundations used by every later inferencer test.

#### Description of phase 1

Create the `packages/inferencer/tests/` directory. Add small shared helpers only when at least two test files use them.

Add direct tests for `AssocArray`. The tests must cover an empty array, the last matching entry, and no matching entry. They must also cover insertion order. The tests must prove that `insert` returns a new `AssocArray` instance without changing the original instance.

Add tests for `convertTermWithPool`. Cover literal references, variable references, nested constructor arguments, and unbound identifiers. The unbound-identifier test must assert the `UnboundIdentifierError` name and useful message details.

Add tests for `eq`. Cover identical variables, variable bindings, matching literals, mismatched literals, matching constructors, nested constructor unification, constructor mismatches, and direct and indirect occurs-check failures. The occurs-check test must assert the `OccursCheckFailedError` name and useful message details.

Add tests for `fresh`. Cover pool creation, counter allocation, state counter updates, and variable identity across separate fresh scopes. Use inline snapshots for small outputs that include exact counters.

Do not add search, logging, integration, or coverage tests in this phase.

#### Acceptance criteria of phase 1

**Agent-tested**

- The focused test files pass with `npm test -- --project inferencer`.
- The diff contains no changes to production files.
- `npm run lint` passes before formatting.
- `npm run fmt` and `npm run fmt:check` pass.

**Test-in-code-tested**

- `AssocArray` tests cover empty lookup, latest-match lookup, missing lookup, insertion order, and non-mutating insertion.
- `convertTermWithPool` tests cover literals, pooled variables, nested constructors, and the unbound-identifier error.
- `eq` tests cover every listed successful and failed unification case.
- The occurs-check tests cover both direct and nested recursive bindings.
- `fresh` tests prove that separate scopes do not share variable identity.
- Small exact-counter assertions use inline snapshots.

### Phase 2: Test search, logs, and result transformations

#### Goal of phase 2

Cover the core search controls and the transformations that prepare substitutions and logs for query results.

#### Description of phase 2

Add controlled goals that return distinct, identifiable solutions. Use these goals to test `run`, `disjN`, and `conjN`.

Cover zero, one, and multiple result limits. Prove that an empty disjunction returns no solutions. Prove that an empty conjunction returns one unchanged solution. Cover successful and failed conjunction branches. Cover backtracking through a failed branch into a later successful branch.

Lock the current disjunction and conjunction solution order in the controlled tests. Use inline snapshots when the complete small output fits in one readable snapshot.

Test that `delay` does not evaluate its goal until the stream forces it. The test must observe evaluation through a local counter rather than private state.

Test `wrapLogs` with nested rules and multiple premises. Prove that each log contains the correct relation, rule, arguments, and premises. Prove that the wrapper does not duplicate parent logs.

Test `toIdempotent` with direct, nested, and chained bindings. Prove that a second transformation does not change the result.

Test `walkLog` with constructors, literals, variables, and nested premises. Prove that all stored terms are resolved against the final substitution.

Do not add `performQuery` tests or canonical example tests in this phase.

#### Acceptance criteria of phase 2

**Agent-tested**

- The focused test files pass with `npm test -- --project inferencer`.
- Coverage execution shows the new search and transformation code as exercised.
- The diff contains no changes to production files.
- Lint and formatting checks pass.

**Test-in-code-tested**

- `run` tests cover zero, one, and multiple requested solutions.
- `disjN` tests cover an empty set, successful branches, failed branches, and exact controlled order.
- `conjN` tests cover an empty set, successful branches, failed branches, and backtracking.
- The `delay` test proves deferred evaluation.
- `wrapLogs` tests cover nested logs, premise order, resolved arguments, and log isolation.
- `toIdempotent` tests cover direct, nested, chained, and repeated transformations.
- `walkLog` tests cover every term kind and nested premises.
- Small search results and counters use inline snapshots.

### Phase 3: Test the public query path and canonical examples

#### Goal of phase 3

Prove that system rules, queries, and derivation trees work together through `performQuery`.

#### Description of phase 3

Add dedicated minimal `System` and `Query` fixtures. The systems must remain valid under the format documents. They must support focused tests for multiple rules, recursion, multiple premises, literals, and constructor arguments.

Test the public result boundary. Cover query variable bindings, literal results, constructor results, absent internal variables, no-solution queries, and a zero result limit.

Test rule compilation through `performQuery`. Cover multiple rules, recursive relations, multiple premises, and the current result limit behavior. Do not import `toRelationStore` in a separate unit test.

Test the fatal error path with an unbound query reference. Assert the error type name and semantic message details. Do not lock the complete formatted error string.

Add smoke tests for all six canonical query files. Load each system and query from its repository path.

Use the following broad expectations for the canonical examples:

- Natural-number equality returns two solutions with the `base` and `ind` rules.
- Natural-number multiplication returns one solution whose result is six and includes an `add` premise.
- Simple type checking returns one `lam` derivation with `var` and `found` premises.
- Application type checking returns one `app` derivation with `lam` and `unit` premises.
- Context membership returns two solutions with the `found` and `next` rules.
- Open-ended judging returns five solutions with one `unit`, three `lam`, and one `app` root rule.

Assert selected bindings and selected derivation nodes for these examples. Do not snapshot the complete derivation trees. Do not require a solution order that the format does not define.

#### Acceptance criteria of phase 3

**Agent-tested**

- The focused integration tests pass with `npm test -- --project inferencer`.
- All six canonical query files load and produce their expected result counts.
- The diff contains no changes to production files.
- Lint and formatting checks pass.
- No test made in this phase imports `mk-codegen.ts` or a private `mk.ts` function.

**Test-in-code-tested**

- Dedicated fixture tests cover successful bindings, literals, constructors, absent internal variables, no solutions, and a zero result limit.
- Integration tests cover multiple rules, recursion, multiple premises, and result limits.
- The fatal error test asserts the error name and semantic details.
- One canonical smoke test exists for each of the six query examples.
- Canonical tests assert selected bindings and selected derivation nodes.
- No canonical test uses a full derivation-tree snapshot.

### Phase 4: Audit coverage and finalize the suite

#### Goal of phase 4

Make the completed suite easy to trust and prepare it for future inferencer changes.

#### Description of phase 4

List every function in the agreed test surface and match it with at least one test. The list includes all functions in `mk.ts`, `performQuery`, and the public methods of `AssocArray`.

Run the coverage command and inspect uncovered lines and branches. Add tests only for meaningful behavior that the phase criteria do not yet cover. Do not add tests that repeat an existing assertion without testing a new branch.

Keep the suite free of private test exports, production changes, numeric coverage thresholds, committed coverage reports, and performance assertions.

Run the complete repository test suite after the inferencer suite passes. Run lint before formatting. Then run the formatting check again.

Review the final diff for temporary fixtures, generated files, unused helpers, and accidental changes outside `packages/inferencer/tests/`.

#### Acceptance criteria of phase 4

**Agent-tested**

- `npm run test:coverage -- --project inferencer` passes and reports the inferencer code as exercised.
- `npm test` passes for the complete repository.
- `npm run lint` passes before formatting.
- `npm run fmt` and `npm run fmt:check` pass.
- The final diff contains only the intended test files.
- The plan file remains unchanged during implementation.

**Test-in-code-tested**

- Every exported `mk.ts` function has at least one direct test.
- `performQuery` has integration tests for successful and failed queries.
- Every public `AssocArray` method has at least one direct test.
- Every behavior group in the final goal has a corresponding regression test.
- The suite contains no private helper imports and no test-only production exports.
- The suite contains no timing assertions or committed coverage artifacts.
- Shared test helpers have at least two callers and contain no unused behavior.
