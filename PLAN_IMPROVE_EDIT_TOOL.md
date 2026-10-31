# Playground Editor Polish Plan

## Final goal

Improve the playground editor in three areas:

- Put the line numbers above the edited text and hide the text that passes under them.
- Highlight the embedded languages of the Markdown DSL: YAML for `jtf-syntax` and `jtf-relation`, and a custom grammar for `jtf-rule`.
- Keep the editor buffer in localStorage across page reloads.

The app must use the last valid system as the base system. The app must also restore the last written buffer, even when that buffer is invalid. Missing or bad stored data must fall back to the base system without a crash.

## Relevant context

- The editor is `packages/playground/components/editor.tsx`. It uses CodeJar and `codejar-linenumbers` (`withLineNumbers`), then calls `Prism.highlightElement`.
- `packages/playground/prism.css` sets `.code[class*='language-']` to `position: relative; z-index: 1`. The line-number gutter has no z-index, so the code paints above the gutter.
- The playground already loads Prism grammars for Markdown, YAML, and markup. The Prism Markdown grammar highlights a fenced code block when `Prism.languages[lang]` exists.
- The Markdown DSL extensions are in `packages/markdown-dsl/extensions.ts`: `metadata`, `syntax`, `relation`, and `rule`.
  - `metadata` comes from YAML frontmatter.
  - `syntax` and `relation` parse YAML.
  - `rule` parses the custom grammar in `packages/markdown-dsl/formats/rule.peggyjs`.
- The live model is `packages/playground/models/live-system.ts`.
  - `process()` parses and validates a Markdown source.
  - The constructor throws when the initial source is invalid.
  - Validation runs 300 ms after a buffer change.
  - The first validation effect run is skipped on purpose.
- `packages/playground/index.tsx` creates the model from `base-system.jtf.md?raw`.
- `packages/playground/components/theme-picker.tsx` already uses the `selected-theme` localStorage key. Leave that code unchanged.
- The repo uses Node 24 with TypeScript type stripping. Imports use explicit `.ts` and `.tsx` extensions.
- No JTD schema or validator module changes are needed, so this plan needs no `npm run codegen` step. Do not edit generated files.
- Commands:
  - `npx vitest run --project playground`
  - `npm run lint`
  - `npm run fmt`
  - Start the dev server from `packages/playground` with `npx vite`.
- The playground tests use jsdom. jsdom does not apply imported CSS files, so visual claims must be checked in a browser.
- Experiments are permitted in `/tmp/opencode/` (OpenCode) or `/tmp/pi-experiments/` (Pi). Remove temporary files from the project folder when done.
- You can use the `browser` tool from the `browsermcp` MCP server to test things in a real browser.

## Methodology

1. Read the files named in "Relevant context" before you change code.
2. Complete only one phase per task. Assume that all previous phases are complete.
3. Start each phase by writing the acceptance tests for that phase.
4. Run the tests and confirm that they fail for the expected reason.
5. Implement the phase.
6. Run `npx vitest run --project playground` and `npm run lint` until they pass.
7. Run the agent-tested checks for the phase. Use a browser or a small experiment where the criteria say so.
8. Run `npm run fmt` after the code is correct.
9. Stop after the phase is complete. The user reviews the changes and commits them before the next phase starts.
10. Do not implement work from a later phase, even when the code makes that work easy.

## Plan phases

### Phase 1: Line numbers above the code

#### Goal of phase 1

Make the line-number gutter paint above the code and hide the code under it.

#### Description of phase 1

Change `packages/playground/prism.css`. Raise the stacking order of the line-number wrapper and gutter above the `.code` layer. Give the gutter an opaque background color from the active daisyUI theme. The gutter background must cover the code pixels below it, including during scroll.

Keep the current gutter width, the code left padding, and the code font. Keep the existing line-number colors readable. Do not change `editor.tsx` or `codejar-linenumbers`.

#### Acceptance criteria of phase 1

- agent-tested:
  - Start the playground. The line numbers paint over the code layer, and no code pixels show through the gutter background.
  - Scroll the editor. The gutter stays aligned with the code lines and continues to hide the code under it.
  - Switch between the light theme and the dark theme. The gutter background and the line numbers stay readable in both themes.
- test-in-code-tested:
  - None. The change is CSS-only, and jsdom does not apply the imported CSS.

### Phase 2: Highlight the Markdown DSL languages

#### Goal of phase 2

Give `jtf-syntax`, `jtf-relation`, and `jtf-rule` code blocks useful syntax colors inside the Markdown editor.

#### Description of phase 2

Add a playground module in `packages/playground/lib/`. The module must register these Prism languages:

- `jtf-syntax`: use the YAML grammar.
- `jtf-relation`: use the YAML grammar.
- `jtf-rule`: use a new custom grammar.

The custom `jtf-rule` grammar must produce structured tokens for:

- The divider line, including the `[Name]` annotation.
- The rule identifier after the divider.
- The `?` variable map and the `%` literal map, including their identifiers and `as` (the keyword).
- Relation calls and their arguments.
- Constructors with parentheses and references without parentheses.
- Punctuation and the identifier annotations in the maps.

Use existing Prism token types where their colors are suitable. Add CSS token rules only when an existing token type cannot show the intended structure.

Import the module from `editor.tsx` after Prism is loaded and before CodeJar starts. Keep the current Markdown, YAML, and markup imports. Frontmatter must keep the YAML highlighting that the Prism Markdown grammar already provides. Do not add math highlighting. Do not change the Markdown DSL package.

#### Acceptance criteria of phase 2

- test-in-code-tested:
  - `Prism.highlight` with the `jtf-syntax` language returns YAML key and value tokens.
  - `Prism.highlight` with the `jtf-relation` language returns YAML key and value tokens.
  - `Prism.highlight` with the `jtf-rule` language returns distinct tokens for the divider, the rule identifier, the map markers, the relation identifiers, and the parentheses.
  - `Prism.highlight` with the Markdown language on a full `.jtf.md` sample returns a token for the fenced code block, and the block content uses the `jtf-rule` grammar.
  - The existing `edit-tool.test.tsx` test still passes.
- agent-tested:
  - Open the playground. The frontmatter, `jtf-syntax`, `jtf-relation`, and `jtf-rule` blocks show different and readable colors.
  - Plain prose and headings keep the normal Markdown colors.
  - Change the theme. The DSL colors stay readable.

### Phase 3: Persist the editor buffer

#### Goal of phase 3

Save the last valid system and the last written buffer in localStorage, then restore both on page load.

#### Description of phase 3

Add a small storage module in `packages/playground/lib/`. Use two plain keys:

- `justify-editor-valid`
- `justify-editor-written`

The module must read both keys and write each key. Treat a missing value, an empty value, or a whitespace-only value as absent. Wrap every storage read and write in a guard. A storage read returns the two values and an error flag. A storage write returns a success flag.

Add a resolver that selects the starting state:

- Use the stored valid source when it parses and validates.
- Use the base system when the stored valid source is absent or invalid.
- Use the stored written source as the initial editor buffer when it is present. Otherwise use the selected base source.

To validate the stored valid source, export the existing `process()` function from `models/live-system.ts` under a clear name. Keep its current behavior.

Wire the resolver in `index.tsx`:

- Create the model from the selected base source.
- After mount, set `editorBuffer` to the initial buffer only when it differs from the base source. The normal 300 ms validation must run after this change.
- After each validation tick, save the current buffer to `justify-editor-written`.
- When a validation succeeds, save the same buffer to `justify-editor-valid`.
- Skip the first run of the persistence effect, like the validation loop does.
- On `pagehide` and on `visibilitychange` when the page becomes hidden, save the current buffer and the current valid state immediately.
- Do not use the `storage` event. Do not synchronize tabs.
- Do not touch the `selected-theme` key.

Keep the persistence logic small. Prefer plain functions and one effect over a new state library.

#### Acceptance criteria of phase 3

- test-in-code-tested:
  - The storage module reads both keys and returns their values.
  - A missing key returns `null`.
  - An empty or whitespace-only key returns `null`.
  - A storage read error returns absent values and an error flag.
  - A storage write error returns `false`.
  - The resolver uses a valid stored valid source as the base.
  - The resolver uses the base system when the stored valid source is invalid, and it reports the problem.
  - The resolver uses the stored written source as the initial buffer when it is present.
  - The resolver uses the selected base source as the initial buffer when the written source is absent.
  - A model initialized from the base source and then given the written buffer marks `outOfDate` after the assignment and validates after 300 ms.
  - The page-hide flush writes the current buffer and the current valid system.
- agent-tested:
  - Edit the description to a new valid value. Reload the page. The same text and the same preview appear.
  - Make the system invalid. Reload the page. The invalid text appears, the last valid preview stays, and the diagnostics appear after the debounce.
  - Clear both localStorage keys. Reload the page. The base system appears.

### Phase 4: Warn about storage problems

#### Goal of phase 4

Tell the user when the playground cannot read or write the saved buffer.

#### Description of phase 4

Add a small toast component to the playground. Use the existing daisyUI classes for a toast and a warning alert. Do not add a dependency.

The toast must:

- Appear at the end of the viewport.
- Show the warning message from a signal.
- Hide itself after a short delay.
- Render nothing when there is no message.

Connect the toast to the storage load error from phase 3. Also show a warning when a write fails. Show at most one write warning per session. A successful write does not need to remove an earlier warning.

Load the `daisyui` skill for this task.

#### Acceptance criteria of phase 4

- test-in-code-tested:
  - The toast renders the warning message when the message signal has a value.
  - The toast renders nothing when the message signal is empty.
  - The toast hides itself after the configured delay.
- agent-tested:
  - Block or break localStorage in the browser, then edit the buffer. A warning toast appears, and the editor keeps working.
  - Use the normal storage path. No warning toast appears.
  - Reload the page with a corrupt stored valid source. A warning toast appears and the base system loads.
