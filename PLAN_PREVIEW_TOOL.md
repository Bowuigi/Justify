# Preview tool plan

## Final goal

The Preview tool shows a verified System as a readable document. It uses the generated TeX from `@justify/tex-extractor`.

The pane contains these parts, in order:

1. A labeled Description section. It renders `\jyDescription`.
2. A Grammar section. It renders `\jyGrammar`.
3. One section per relation, in System insertion order.

Each relation section contains:

- A left-aligned humanized Title Case heading.
- A centered `\jrd<relation>` header.
- Centered `\jrrs<relation>` rules that wrap.

A relation with zero rules shows its header and a muted text placeholder.

The `extractTeX(system)` preamble goes before every KaTeX expression. A bad expression renders red and does not crash the pane. `ToolGuard` keeps the existing stale-system behavior.

## Required context

- `extractTeX(system)` in `packages/tex-extractor/lib.ts` returns a preamble. The preamble contains multi-line `\newcommand` definitions.
- KaTeX accepts `\newcommand` inside a math string. A test render with `extractTeX` output plus `\jyGrammar`, `\jrdAdd`, and `\jrrsAdd` succeeded.
- `commandOf(namespace, invocation, args?)` exists in `packages/tex-extractor/lib.ts`. It is not exported. It maps names to TeX commands.
- `commandOf('system', 'grammar')` gives `\jyGrammar`.
- `commandOf('system', 'description')` gives `\jyDescription`.
- `commandOf('relationDescription', relation)` gives `\jrd<Relation>`.
- `commandOf('relationRuleset', relation)` gives `\jrrs<Relation>`.
- System relation keys are snake_case identifiers. Example: `judge_member`.
- `katex.renderToString` takes the complete math string.
- KaTeX 0.19 splits `\allowbreak` points into `.katex-base` elements. CSS can make these elements wrap.
- The verified System signal is `verifiedSystem.value`. `ToolGuard` supplies the stale badge.

The following CSS makes rule sets wrap and stay centered:

```css
.preview-rules .katex-display {
  margin: 0;
}

.preview-rules .katex-display > .katex {
  white-space: normal;
}

.preview-rules .katex .katex-base {
  width: auto;
}
```

A 300 px screenshot test showed that these rules wrap into two centered rows.

## Methodology

Use Acceptance-Test Driven Development for each phase.

1. Write the phase acceptance tests before the implementation.
2. Run the new tests. Make sure that each test fails for the intended reason.
3. Write the minimum implementation that makes the tests pass.
4. Run the targeted test project.
5. Refactor only while all tests pass.
6. Do not start the next phase until every criterion in the current phase passes.

Use these commands:

```sh
npx vitest run --project tex-extractor
npx vitest run --project playground
npm run lint
npm run fmt
npm run build -w @justify/playground
```

For a visual criterion, start the playground and capture a narrow-pane screenshot. Use a 300 px content width. Examine the screenshot for wrapping, centering, and horizontal overflow.

```sh
npm run dev -w @justify/playground -- --host 127.0.0.1
chromium --headless --disable-gpu --no-sandbox --hide-scrollbars \
  --window-size=340,900 --screenshot=$EXP_DIR/preview-tool.png <url>
```

Where `$EXP_DIR` is the directory where experiments can be performed (you replace it, it's not an env variable). On OpenCode, that's `/tmp/opencode/`. On Pi, that's `/tmp/pi-experiments/`.

## Plan phases

## Phase 1: Public TeX command naming API

### Phase goal

Expose the existing command-name mapping from `@justify/tex-extractor`. Generated output stays unchanged.

### Description

Export `commandOf` and the `TeXNamespace` type from `packages/tex-extractor/lib.ts`. Keep `extractTeX` output byte-for-byte equivalent. Add tests in `packages/tex-extractor/tests/*.test.ts`.

Use the public `commandOf` export in `extractTeX`. This keeps one source of truth for command names.

### Acceptance criteria

- **[Vitest]** The package entry point exports `commandOf`.
- **[Vitest]** `commandOf('system', 'grammar')` returns `\jyGrammar`.
- **[Vitest]** `commandOf('system', 'description')` returns `\jyDescription`.
- **[Vitest]** `commandOf('relationDescription', 'judge_member')` returns `\jrdJudgeMember`.
- **[Vitest]** `commandOf('relationRuleset', 'add')` returns `\jrrsAdd`.
- **[Vitest]** `commandOf` renders arguments as consecutive brace groups.
- **[Vitest]** `extractTeX` on an existing example still contains `\newcommand{\jyGrammar}`, `\jrdAdd`, and `\jrrsAdd`.
- **[Agent]** `npm run lint` and `npm run fmt` pass.

## Phase 2: Preview section model and preamble-aware math block

### Phase goal

Provide tested playground utilities that turn a verified System into Preview sections. Provide a math block that renders with the preamble attached.

### Description

Create `packages/playground/models/preview.ts` with these exports:

```ts
export interface PreviewRelation {
  id: string;
  title: string;
  header: string;
  rules: string;
  hasRules: boolean;
}

export interface PreviewSections {
  description: string;
  grammar: string;
  relations: Array<PreviewRelation>;
}

export function humanizeIdentifier(id: string): string;
export function previewSections(system: System): PreviewSections;
```

`humanizeIdentifier` splits snake_case words, capitalizes each word, and joins the words with spaces. It keeps digits. Examples: `add` gives `Add`. `judge_member` gives `Judge Member`.

`previewSections` builds these expressions with `commandOf`:

- Description: `commandOf('system', 'description')`.
- Grammar: `commandOf('system', 'grammar')`.
- Header: `commandOf('relationDescription', relationID)`.
- Rules: `commandOf('relationRuleset', relationID)`.

Use `Object.entries(system.relations)` to keep insertion order. Set `hasRules` to `relation.rules.length > 0`.

Create `packages/playground/components/tex-block.tsx`. It renders `katex.renderToString` of `${preamble}\n${expression}` with `displayMode: true` and `throwOnError: false`. Its props are `preamble`, `expression`, and an optional `class`.

### Acceptance criteria

- **[Vitest]** `humanizeIdentifier('add')` returns `Add`.
- **[Vitest]** `humanizeIdentifier('judge_member')` returns `Judge Member`.
- **[Vitest]** `humanizeIdentifier` keeps digits in an identifier.
- **[Vitest]** `previewSections` returns Description and Grammar expressions for the base system.
- **[Vitest]** `previewSections` returns relations in System insertion order.
- **[Vitest]** The base relation `add` has `header` equal to `\jrdAdd` and `rules` equal to `\jrrsAdd`.
- **[Vitest]** A relation with zero rules has `hasRules === false`.
- **[Vitest]** `TexBlock` with the base preamble renders a `.katex` element.
- **[Vitest]** `TexBlock` with the base preamble renders no `.katex-error` element.
- **[Agent]** `npm run lint` and `npm run fmt` pass.

## Phase 3: Preview pane UI, wrapping, and styling

### Phase goal

Replace the placeholder Preview tool with the final flat-list layout. Rule sets wrap and stay centered.

### Description

Rewrite `packages/playground/components/preview-tool.tsx`. Keep `ToolGuard`.

Compute the preamble once per verified System with `useMemo`. Compute the sections once per verified System with `useMemo`.

Use this structure:

- A root element with `data-testid="preview-tool"`.
- A Description section with an `<h2>` label `Description` and a `TexBlock` for `description`.
- An `<hr>` after the Description section.
- A Grammar section with an `<h2>` label `Grammar` and a `TexBlock` for `grammar`.
- For each relation, an `<hr>`, then a `<section>` with `data-testid={`relation-${id}`}`.
- The relation section has an `<h3>` with the humanized title.
- The relation section has a centered `TexBlock` for `header`.
- The relation section has a rules container with the `preview-rules` class and `data-testid={`rules-${id}`}`. This container holds the `TexBlock` for `rules`.
- A relation with no rules has a `p` element with muted text `No rules defined`. It has no rules container.

Add the wrapping CSS from the Required context section to `packages/playground/app.css`. Scope it to `.preview-rules`.

Use padding between sections. Use `<hr>` elements as the section dividers. Align section headings to the left. Keep the generated header math centered.

### Acceptance criteria

- **[Vitest]** The base system renders the headings `Description`, `Grammar`, and `Add`.
- **[Vitest]** The base system renders four `.katex` elements.
- **[Vitest]** The base system renders no `.katex-error` element.
- **[Vitest]** A multi-relation test input renders relation sections in insertion order.
- **[Vitest]** The multi-relation test input renders humanized relation titles.
- **[Vitest]** A zero-rule relation renders its header and `No rules defined`.
- **[Vitest]** A zero-rule relation renders no element with a `rules-` test ID.
- **[Vitest]** Every rendered relation rules container has the `preview-rules` class.
- **[Vitest]** After an editor change, the `Stale` badge appears and the previous preview content stays visible.
- **[Agent]** A 300 px screenshot shows the Base and Ind rules on multiple centered lines.
- **[Agent]** The screenshot shows no horizontal overflow in the Preview pane.
- **[Agent]** `npm run build -w @justify/playground` succeeds.
- **[Agent]** `npm run lint` and `npm run fmt` pass.

## Phase 4: Resilience, accessibility, and final verification

### Phase goal

Harden Preview against unusual Systems. Confirm the semantic structure and the whole-repository quality.

### Description

Use `throwOnError: false`. An unsupported command must color only its own expression red. The other sections must stay visible.

Use semantic `<section>` elements. Use `<h2>` for Description and Grammar. Use `<h3>` for relation titles.

Make sure that Description and Grammar render when the System has no relations. A System with no relations must not crash.

Confirm that the preamble and section objects use `useMemo` with the verified System as the dependency.

### Acceptance criteria

- **[Vitest]** A System with an unsupported LaTeX command shows a `.katex-error` in that expression.
- **[Vitest]** The same System still renders the Grammar section and all relation sections.
- **[Vitest]** A System with no relations renders Description and Grammar.
- **[Vitest]** A System with no relations renders zero relation sections.
- **[Vitest]** Description and Grammar are `<h2>` elements.
- **[Vitest]** Relation titles are `<h3>` elements.
- **[Vitest]** All playground tests pass.
- **[Vitest]** The full `npm test` suite passes.
- **[Agent]** `npm run lint`, `npm run fmt`, and `npm run build -w @justify/playground` pass.
- **[Agent]** Wide-pane and narrow-pane screenshots show centered headers, wrapped rules, and readable spacing.
