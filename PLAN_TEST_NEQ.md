# Inferencer `neq` goal test plan

## Final goal

Add acceptance tests for a future `neq` goal in `packages/inferencer/mk.ts`. The goal has the intended signature `neq(termA: Term, termB: Term): Goal`. It must also be reachable from inference-rule premises through the special relation `prim_neq`.

The tests describe intended behavior only. They do not implement `neq`, `prim_neq`, or the codegen special case.

All new tests use Vitest `it.fails`. The current stub throws `Not yet implemented`, and `prim_neq` is absent from the relation store. Thus every new test is expected to fail during implementation of this plan, and the suite stays green. When the real implementation lands, the `.fails` tests fail. The implementer must then convert them to normal `it` tests.

`neq` is a deferred disequality constraint with call-time checks:

- **Trivial success**: no substitution can make the terms equal. No constraint is stored.
- **Trivial failure**: the terms are already equal under the current substitution.
- **Deferred success**: the terms can unify only by binding unbound variables. `neq` succeeds and stores a constraint.

Successful `neq` must not bind variables, add logs, or change the counter.

The QueryResult format now carries constraints. Every solution has a `constraints` field of the shape `{ neq: Array<{ a: DerivationTerm; b: DerivationTerm }> }`. Pending constraints appear there after resolution against the final substitution. A constraint that becomes trivially true must not appear.

## Relevant context

### Files and roles

- `packages/inferencer/mk.ts` contains the core goals.
  - `Constraints` is defined at line 39.
  - `State` carries `constraints` at line 49.
  - `walkConstraints` is exported at line 285. It resolves constraint terms against a substitution.
  - `run` initializes `constraints: { neq: [] }` at line 328.
  - `eq` is at line 334.
  - The `neq` stub is at line 347 and throws.
- `packages/inferencer/mk-codegen.ts` contains `toRelationStore`. It iterates only `system.relations`. The future implementation must special-case `prim_neq`.
- `packages/inferencer/lib.ts` contains `performQuery`. It walks constraints at lines 45 to 49 and adds them to every solution.
- `packages/inferencer/tests/helpers.ts` contains `var_`, `lit`, and `con`.
- `packages/inferencer/tests/mk-terms.test.ts` shows the style for direct `eq`, `fresh`, and error tests.
- `packages/inferencer/tests/mk-search.test.ts` shows the style for `conjN`, `disjN`, and `run`.
- `packages/inferencer/tests/perform-query.test.ts` shows the style for minimal `System` fixtures and `performQuery` tests.

### Format references

- `docs/QueryResult.md` line 21 defines the `constraints` field of a solution. It states that an empty value means no extra constraints.
- `docs/QueryResult.md` lines 33 to 42 define constraints grouped by type and the `neq` constraint arguments `a` and `b`.
- `formats/query-result.jtd.json` marks `variables` and `constraints` as required solution properties. It defines `constraints.neq` as an array of objects with `a` and `b` derivation terms.

### Intended semantics

- `neq` uses the same structural rules as `eq`, but returns the opposite result.
- `neq` walks the current substitution before it compares terms. Chained bindings must resolve.
- `neq` must not throw `OccursCheckFailedError`. A pair that fails the occurs check cannot unify, so `neq` succeeds.
- A pending constraint at the end of a query is a valid solution if no later binding violates it.
- Later `eq` goals must check pending constraints in both orders: constraint before binding, and binding before constraint.
- Constraint terms are resolved against the final substitution before `performQuery` returns them.
- A constraint that becomes trivially true is removed from the result.
- A solution with no constraints has `constraints` equal to `{ neq: [] }`.

### What is out of scope

- Implementing `neq`, `prim_neq`, or constraint propagation.
- Changing `State`, `QueryResult`, the validator, or `mk-codegen.ts`.
- Exposing the internal constraint store as a test-only API.
- Validating the `prim_neq` fixture with the validator. The validator currently rejects undefined premise relations. The future validator special case is out of scope.

### Commands

Run the focused project tests with:

```sh
npm test -- --project inferencer
```

Follow the repository quality gates in this order:

```sh
npm run lint
npm run fmt
npm run fmt:check
```

Put experiments in `/tmp/pi-experiments/*`. Remove each experiment after you record the result.

## Methodology

The plan uses acceptance-test-driven development. Each phase starts with tests that state the intended behavior. The tests fail for the expected reason. The implementer does not change production code in any phase.

1. Read `packages/inferencer/mk.ts`, `packages/inferencer/mk-codegen.ts`, `packages/inferencer/lib.ts`, `docs/QueryResult.md`, and the existing tests in `packages/inferencer/tests/`.
2. Implement only the requested phase. Assume all earlier phases are complete. Do not implement later phases.
3. Write the named failing tests for the phase before adding helpers or fixtures.
4. Run the focused test file. Make sure each test fails because `neq` throws, or because `prim_neq` is missing. A new test that passes is a defect in the test.
5. Run the inferencer project tests. The suite must stay green because the new tests use `it.fails`.
6. Run lint, then formatting, then the formatting check.
7. Review the diff. It must contain test changes only.
8. Report the phase result to the user.
9. Stop after one phase.

If a test shows a defect in the intended behavior or in production behavior, stop and report the problem. Do not change production code without explicit approval.

## Plan phases

### Phase 1: Test the direct `neq` goal

#### Goal of phase 1

Add failing acceptance tests for the `neq` goal in `packages/inferencer/tests/mk-neq.test.ts`. The tests must describe every required case for direct `neq` calls.

#### Description of phase 1

Create `packages/inferencer/tests/mk-neq.test.ts`. Import `conjN`, `eq`, `neq`, and `run` from `../mk.ts`. Import `con`, `lit`, and `var_` from `./helpers.ts`. Wrap every test in `it.fails`.

Add a test group for trivial success. Each case must return one solution with no bindings. Cover these cases:

- Two different literals.
- A literal and a constructor.
- Two constructors with different tags.
- Two constructors with equal tags and different `from` values.
- An occurs-check pair: `neq(x, pair(x))`.

Add a test group for trivial failure. Each case must return no solutions. Cover these cases:

- Two identical variables.
- Two equal literals.
- A variable bound to an equal literal by an earlier `eq`.
- A variable bound through a chain to an equal literal.
- Two equal constructors.
- Two nested constructors that become equal after bindings.

Add a test group for deferred success. Each case must return one solution. Cover these cases:

- `neq(x, lit('a'))` with no later `eq`.
- `neq(x, y)` with two unbound variables.
- `neq(x, pair(lit('a')))` with an unbound variable.
- `neq(pair(x), pair(y))` with unbound variables inside constructors.

For cases with no later `eq`, assert that `subst.data` is `[]`, `log` is `[]`, and `counter` is `0`. Do not inspect the internal `constraints` field. Phase 3 asserts surfaced constraints through `performQuery`.

Add a test group for constraint resolution with `conjN`. Cover both orders for each pair:

- `neq(x, lit('a'))` and `eq(x, lit('a'))` must return no solutions.
- `neq(x, lit('a'))` and `eq(x, lit('b'))` must return one solution.
- `neq(x, y)` and `eq(x, y)` must return no solutions.
- `neq(x, y)`, `eq(x, lit('a'))`, and `eq(y, lit('b'))` must return one solution.
- A nested constraint on `pair(x)` and `pair(y)` must fail when `x` and `y` become equal, and must succeed when they become different.

Add a test group for the occurs check. `neq(x, pair(x))` must return one solution and must not throw.

Do not add `performQuery` tests or `prim_neq` tests in this phase.

#### Acceptance criteria of phase 1

**Agent-tested**

- `packages/inferencer/tests/mk-neq.test.ts` exists and contains only `it.fails` tests.
- Every new test fails for the expected reason during the run: `neq` throws `Not yet implemented`.
- `npm test -- --project inferencer` stays green.
- The diff contains no production changes.
- `npm run lint`, `npm run fmt`, and `npm run fmt:check` pass.

**Test-in-code-tested**

- Trivial success tests cover different literals, literal against constructor, different constructor tags, equal tags with different `from`, and the occurs-check pair.
- Trivial failure tests cover identical variables, equal literals, a bound variable, a chained binding, and nested equal constructors.
- Deferred success tests cover variable against literal, variable against variable, variable inside a constructor, and variables inside both constructors.
- Successful `neq` tests assert that the substitution, log, and counter do not change.
- Constraint resolution tests cover both goal orders.
- Constraint resolution tests cover simple and nested constraints.
- The occurs-check test asserts success and no error.
- No test in this phase inspects `constraints` directly.

### Phase 2: Test `prim_neq` through `performQuery`

#### Goal of phase 2

Add failing integration tests for the `prim_neq` premise in `packages/inferencer/tests/prim-neq.test.ts`.

#### Description of phase 2

Create `packages/inferencer/tests/prim-neq.test.ts`. Import `performQuery` from `../lib.ts`. Define a minimal `System` fixture in the file, with `satisfies System` typing from `@justify/core`.

The fixture has one syntax category named `value`. It contains the constructors `zero` (no arguments), `succ` (one `value` argument), and `pair` (two `value` arguments).

The fixture has two relations:

- `different`: two `value` arguments named `left` and `right`. One rule named `diff` binds both arguments by pattern, then calls `prim_neq(left, right)` as its only premise.
- `differentPair`: one `value` argument named `item`. One rule named `diff-pair` matches `pair(left, right)` and calls `prim_neq(left, right)`.

Build `System`, `Query`, and term fixtures with small local helper functions, in the style of `perform-query.test.ts`. Wrap every test in `it.fails`.

Add a result test group with these cases:

- A query with two different ground constructors returns one solution.
- A query with two equal ground constructors returns no solutions.
- A query with two different nested `pair` constructors returns one solution.
- A query with two equal nested `pair` constructors returns no solutions.
- A query on `differentPair` with variables bound by the pattern returns the expected solution when the pair elements differ.
- A query on `differentPair` with variables bound by the pattern returns no solution when the pair elements are equal.
- A query on `different` with two unbound query variables returns one solution with a pending constraint.

Add a derivation test group. For a successful `prim_neq` premise, assert that its derivation node has `relation` equal to `prim_neq`, `rule` equal to `prim`, `premises` equal to `[]`, and `args` equal to the resolved terms.

Do not assert the complete derivation tree.

Do not add tests for surfaced constraints in this phase. Phase 3 adds them to the same file.

#### Acceptance criteria of phase 2

**Agent-tested**

- `packages/inferencer/tests/prim-neq.test.ts` exists and contains only `it.fails` tests.
- Every new test fails for the expected reason during the run: `prim_neq` is absent, or the goal throws.
- `npm test -- --project inferencer` stays green.
- The diff contains no production changes.
- `npm run lint`, `npm run fmt`, and `npm run fmt:check` pass.
- No test imports `mk-codegen.ts` or a private `mk.ts` function.

**Test-in-code-tested**

- The fixture covers different ground constructors, equal ground constructors, different nested constructors, and equal nested constructors.
- The fixture covers variables bound before the `prim_neq` call.
- The fixture covers pending constraints on unbound variables.
- The derivation test asserts `relation`, `rule`, `premises`, and resolved `args`.
- No test asserts the complete derivation tree.
- Every test calls the public `performQuery` function.

### Phase 3: Test surfaced constraints

#### Goal of phase 3

Add failing acceptance tests for the `constraints` field of query solutions. The tests must describe pending, absent, resolved, and inferred constraints.

#### Description of phase 3

Extend `packages/inferencer/tests/prim-neq.test.ts` with a new describe group for surfaced constraints. Reuse the fixture from Phase 2. Extend the fixture only when a test needs a new relation or rule.

Add a pending-constraint group. A query on `different` with two unbound query variables must return one solution whose `constraints.neq` contains one entry. Assert that `a` and `b` are the query variables after resolution. Use an inline snapshot when the complete value is small and readable.

Add an absent-constraint group. A query with two different ground constructors must return one solution whose `constraints` equals `{ neq: [] }`. Add a case where a constraint is checked at call time and found trivially true after a later binding. The result must also have `constraints` equal to `{ neq: [] }`.

Add a resolved-constraint group. Cover these cases:

- A query with one side unbound keeps the constraint. Assert that the bound side is a resolved constructor term and the unbound side is a variable term.
- A query whose later premises bind both sides to different ground terms removes the constraint. Assert `{ neq: [] }`.
- A query whose later premises bind both sides to equal ground terms returns no solutions.

To support the resolved and call-time cases, extend the fixture with relations that bind their argument to a fixed constructor. For example, a relation that succeeds only for `zero`, and another that succeeds only for `succ(zero)`. A rule can then call `prim_neq(left, right)` before or after those relations.

Assert constraints only through the public `performQuery` result. Do not read `State.constraints`, do not import `walkConstraints`, and do not add test-only exports.

Do not assert the complete derivation tree.

#### Acceptance criteria of phase 3

**Agent-tested**

- `packages/inferencer/tests/prim-neq.test.ts` contains the surfaced-constraint tests and only `it.fails` tests for the new behavior.
- Every new test fails for the expected reason during the run: `prim_neq` is absent, or the goal throws.
- `npm test -- --project inferencer` stays green.
- The diff contains no production changes.
- `npm run lint`, `npm run fmt`, and `npm run fmt:check` pass.
- No test imports `mk-codegen.ts`, `walkConstraints`, or a private `mk.ts` function.

**Test-in-code-tested**

- A pending constraint appears in `constraints.neq` as a resolved `a` and `b` pair.
- A solution with no constraints has `constraints` equal to `{ neq: [] }`.
- A constraint that becomes trivially true after later bindings is absent from the result.
- A constraint whose later bindings make the terms equal produces no solutions.
- A constraint with one unbound side contains a variable term for that side and a resolved term for the other side.
- Every constraint assertion uses the public `performQuery` result.
- No test reads `State.constraints` directly.
