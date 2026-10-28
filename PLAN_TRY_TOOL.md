# Plan: Try tool for the playground

## Final goal

Implement the Try tool in `packages/playground`. The tool must accept a Query JSON document, validate it, and run it against the latest verified System.

The tool must show every solution, its variable bindings, and its derivation tree. A valid System change must trigger a new run. An invalid query must stop execution and keep the last successful result visible.

The feature must reuse the System TeX preamble. It must also add derivation-tree support to `@justify/tex-extractor`.

## Relevant context

### Behavior before implementing this plan

- `packages/playground/components/try-tool.tsx` contains a placeholder. It only shows System counts.
- `packages/playground/index.tsx` already registers the Try tool in the tool picker and layouts.
- `packages/playground/models/live-system.ts` owns the editor buffer and verified System.
- The verified System changes only after the System passes Markdown DSL and semantic validation.
- An invalid System edit leaves the previous verified System in place.
- `packages/playground/components/tool-guard.tsx` shows the `Stale` badge when the System is out of date.
- `packages/playground/components/preview-tool.tsx` computes its own preamble with `extractTeX(system)`.
- `packages/playground/components/tex-block.tsx` requires a `preamble` prop.
- The Query text must remain local to `TryTool`. A tool switch can discard it.
- The Try tool does not need a Run button, a query delay, query persistence, zoom, or pan.

### Data and library interfaces

- `queryFromJSONString(filename, jsonString)` returns a `LoadResult<Query>`. It handles JSON parsing and the Query JSON shape.
- `validateQuery(query, system, filename)` returns semantic diagnostics for a Query and System.
- `performQuery(system, query)` returns `Array<QueryResultSolution>` or a fatal error string.
- `extractTeX(system)` returns the TeX preamble for a System.
- `commandOf(namespace, invocation, args)` returns the TeX command names used by the preamble.
- A `Derivation` contains its relation, rule ID, resolved arguments, and premise derivations.
- A `DerivationTerm` can be a constructor, literal, or variable.
- A variable contains its name in `id` and its unique inferencer counter in `counter`.
- The CLI shows a variable as `id@counter`. The Try tool must show it as a TeX superscript, such as `x^{5}`.
- The System stores the display text for each rule in `rule.rule.tex`.
- The Query stores the display text for variables and literals in `variables` and `literals`.

### Agreed behavior

- The textarea accepts the existing Query JSON format.
- The tool validates the Query before it calls the inferencer.
- The tool processes each query edit without an extra delay.
- The tool uses the latest verified System. The System editor keeps its existing 300 ms delay.
- The tool keeps the last successful result when the current query is invalid.
- The tool shows `Previous result` only while the current query has validation diagnostics.
- The tool shows every solution in inferencer order.
- The tool shows bindings before each derivation tree.
- The tool shows a plain red fatal error message if execution fails.
- The tool shows a clear message when a valid query has no solutions.
- The result area supports horizontal and vertical scrolling.

### Derivation layout

- Each node uses a fraction-like layout.
- Sibling premises appear horizontally above the inference line and use `\qquad` as the separator.
- The conclusion appears below the inference line.
- The rule display text appears to the right of the fraction.
- A rule without premises keeps an empty numerator and the inference line.
- The layout mirrors `\jyInfer`, but it differs from `\jyInfer` because its premises are horizontal.
- The root node uses the Query variable and literal mappings.
- A nested node uses the selected rule's variable and literal mappings.
- A missing mapping falls back to the identifier.
- Constructors use the grammar commands from the System preamble.
- Relation conclusions use the relation commands from the System preamble.

### Main files

- `packages/playground/models/live-system.ts`
- `packages/playground/hooks/use-live-system.tsx`
- `packages/playground/components/tex-block.tsx`
- `packages/playground/components/preview-tool.tsx`
- `packages/playground/components/try-tool.tsx`
- `packages/playground/lib/try.ts`, if a pure helper keeps the component small
- `packages/playground/tests/`
- `packages/tex-extractor/lib.ts`
- `packages/tex-extractor/tests/`
- `packages/tex-extractor/README.md`

### Toolchain

- Run the focused tests with `npx vitest run --project playground` or `npx vitest run --project tex-extractor`.
- Run the complete test suite before the final phase.
- Do not change the JTD schemas. Do not run codegen for this feature.
- Use daisyUI components and Tailwind classes for the textarea, button, messages, and scroll area. Load the `daisyui` skill before doing so.

## Methodology

1. Read this plan in full, `docs/common.md`, `docs/Query.md`, and `docs/QueryResult.md` before starting the assigned phase.
2. Write the acceptance tests for the assigned phase before changing production code.
3. Run the new tests and make sure that they fail for the intended reason.
4. Implement only the assigned phase. Leave later phases unchanged.
5. Run the focused project tests after each implementation step.
6. Run `npm run lint`, then `npm run fmt` (it tells you what files changed due to formatting).
7. Use `/tmp/pi-experiments/*/` for scratch experiments. Remove scratch files before the phase ends.
8. Use `npm run -w @justify/playground dev` for browser checks, creating 1366x768 px screenshots with headless chromium if needed. Test the same flow that the agent acceptance criteria describe.
9. Give the completed phase to the user for review, along with a summary of what was changed.

An executor working on phase N must assume that phases 1 through N-1 are complete. The executor must complete only phase N.

## Plan phases

### Phase 1: Share the verified-System TeX preamble

#### Goal of phase 1

Store one generated TeX preamble in the live-system model. Make `TexBlock` use that preamble by default.

#### Description of phase 1

Add a read-only `texPreamble` signal to `LiveSystemModel`. Initialize it with `extractTeX` for the initial verified System. Update it in the same signal batch that stores a newly verified System.

Keep the old preamble when a System edit fails validation. This behavior must match the preserved `verifiedSystem` value.

The simplest way to do all of this is by using a `computed` Preact signal linked to `verifiedSystem`, changing on demand automatically. See if a computed signal handles both this and initialization instead of relying on a separate `signal` set manually.

Allow `TexBlock` to read the shared preamble through the live-system context.

Update `PreviewTool` to use the default preamble. Remove its duplicate `extractTeX` call and preamble memo. This change proves that Preview and later Try-tool blocks share one preamble.

Add focused tests for the model update rules and the `TexBlock` behavior. Update the existing Preview tests so that they exercise the shared path.

#### Acceptance criteria of phase 1

##### Agent-tested

- Start the playground and open Preview. The Description, Grammar, and Relations sections render without KaTeX errors.
- Edit the System description to a valid value. The Preview updates after System validation completes.
- Edit the System into an invalid state. The old Preview content remains visible, and the `Stale` badge appears.

##### Test-in-code-tested

- The initial live-system `texPreamble` equals `extractTeX` for the initial verified System.
- A valid System update changes the live-system preamble and the verified System together.
- An invalid System update preserves both the previous preamble and the previous verified System.
- `TexBlock` uses the shared preamble.
- `PreviewTool` uses the default `TexBlock` preamble path.
- The existing Preview and live-system test suites pass.

### Phase 2: Render derivation terms and trees as TeX

#### Goal of phase 2

Add public TeX extraction functions for derivation terms and derivation trees.

#### Description of phase 2

Extend `@justify/tex-extractor` with focused functions for derivation terms and trees. Keep the System `texPreamble` as the source of all constructor, relation, and layout macros.

Name the public API `TeXScope`, `extractDerivationTermTeX(system, term, scope)`, and `extractDerivationTeX(system, derivation, rootScope)`. `TeXScope` must contain the variable and literal mappings.

Add a horizontal tree macro named `\jyTree` to the output of `extractTeX` (from `@justify/tex-extractor`). It must mirror `\jyInfer` but place its premise argument in a horizontal array. Its shape must remain equivalent to this conceptual form:

```tex
\dfrac{\begin{array}{c} <premises> \end{array}}{ <conclusion> } \,\text{[<rule tex>]}
```

The premise argument must contain sibling premise trees separated by `\qquad`. It must be empty for a rule without premises.

Render constructors with the existing grammar command names. Render a node conclusion with its relation command. Render the rule label with the selected rule's `rule.rule.tex` value from the System.

Render a variable with its scope's TeX and a superscript that contains its counter. For example, render a mapped variable `x` with counter `5` as `x^{5}`. Use the identifier and the same superscript when the scope has no mapping. Render a literal with its scope's TeX, or with its identifier when no mapping exists.

Use the Query scope for the root node. Use the selected rule scope for each nested node. Recurse through premises in their recorded order.

Add unit tests for leaves, nested nodes, sibling premises, constructors, relations, rule labels, and both variable scopes. Add a browser experiment that confirms that KaTeX accepts the generated tree.

#### Acceptance criteria of phase 2

##### Agent-tested

- Render a nested derivation through KaTeX. The output contains no `.katex-error` element.
- A node with two premises shows the two premise trees side by side.
- A leaf node shows an empty fraction numerator, a conclusion below the line, and the rule label on the right.

##### Test-in-code-tested

- `extractTeX` (from `@justify/tex-extractor`) defines the horizontal tree macro and retains the existing `\jyInfer` macro.
- A leaf tree uses an empty premise argument and the System rule's `tex` value.
- A multi-premise tree separates immediate premises with `\qquad`.
- Nested premise trees appear inside their parent premise argument.
- A constructor argument uses the System grammar command for its category and tag.
- A conclusion uses the System relation command for its relation.
- A root variable uses the Query mapping and renders its counter as a superscript.
- A nested variable uses the selected rule mapping and renders its counter as a superscript.
- An unmapped variable falls back to its identifier and still renders its counter as a superscript.
- A mapped literal uses its scope mapping, and an unmapped literal uses its identifier.
- The complete `tex-extractor` test suite passes.

### Phase 3: Implement the Try-tool workflow

#### Goal of phase 3

Provide a complete Try tool that validates, runs, and shows Query results.

#### Description of phase 3

Replace the placeholder in `TryTool` with a small textarea and a `Clear` button. Keep the query text in local component state. Do not add a Run button or a query delay.

On each query or verified-System change, parse the query with `queryFromJSONString`. Then validate the parsed Query against the current verified System with `validateQuery`. Use `<query>` as the diagnostic source name.

Call `performQuery` only after both validation steps pass. Catch a returned fatal error string and any thrown execution error. Show either error as plain red text. Do not replace the last successful result after a fatal error.

Keep the last successful result when the current query has parsing or semantic diagnostics. Show the `Previous result` label only in that state. Clear the result when the textarea becomes empty. A valid query with zero solutions replaces the old result with a no-solutions message.

Use the derivation-term and derivation-tree functions from `@justify/tex-extractor`. Show each solution in order. Show its bindings before its derivation tree. Use the Query variable mapping for binding names. Omit the bindings section when the solution has no variables.

Render all TeX with `TexBlock` and its shared preamble. Put the result area in a container with horizontal and vertical scrolling. Keep the `ToolGuard` around the tool so the existing System `Stale` badge remains visible.

Add component tests for validation, execution, result retention, system changes, and error states. Add a pure helper only if it makes the validation flow easier to test.

#### Acceptance criteria of phase 3

##### Agent-tested

- Paste a valid Query JSON document for the starter System. The tool shows the solution, bindings, and derivation tree without a Run action.
- Edit the valid Query. The tool processes the edit immediately and shows the new result.
- Enter malformed JSON after a successful run. Diagnostic cards appear, and the `Previous result` label marks the retained result.
- Enter a Query that fails semantic validation. The inferencer does not run, and the retained result stays visible.
- Edit the System into a valid state. The tool runs the same Query again against the new verified System.
- Edit the System into an invalid state. The last result remains visible, and the `Stale` badge appears.
- Click `Clear`. The textarea, diagnostics, and result become empty.
- Open a large derivation. The result area scrolls in both directions.

##### Test-in-code-tested

- An empty textarea shows a prompt and no result.
- The `Clear` button empties the textarea, diagnostics, and result.
- Malformed JSON produces a diagnostic and never calls the inferencer.
- A semantically invalid Query produces diagnostics and never calls the inferencer.
- A valid Query calls `performQuery` with the parsed Query and the latest verified System.
- The tool calls the inferencer without an added timer or delay.
- Every returned solution appears in inferencer order.
- Each solution shows its bindings before its derivation tree.
- A solution without variables omits the bindings section.
- A valid query with no solutions shows a no-solutions message and replaces the old result.
- An invalid query keeps the last successful result and shows `Previous result`.
- A successful result does not show the `Previous result` label.
- A fatal inferencer result shows plain red text and keeps the last successful result.
- A thrown inferencer error shows plain red text and keeps the last successful result.
- A verified-System change validates and runs the current Query again.
- An invalid System edit does not change the verified System or trigger a run against editor text.
- Unmounting `TryTool` discards its local query text and result.
- The Playground and complete repository test suites pass.
- `npm run lint`, `npm run fmt`, and `npm run fmt:check` pass.
