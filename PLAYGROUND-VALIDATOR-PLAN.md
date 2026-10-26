# Playground validator plan

## Purpose

The playground provides a live, guarded `System` model. The model converts Markdown, validates the result, and preserves the last working `System`.

Try and Preview consume the guarded model. Validate shows the diagnostics from the latest completed validation attempt.

The work uses Preact signals throughout the model and tool boundary.

The plan follows acceptance-test-driven development (ATDD). Each phase uses a red → green cycle.

1. Read the assigned phase.
2. Write one acceptance test for one public behavior.
3. Place the test in `packages/playground/tests/`.
4. Run the test and observe the expected failure.
5. Implement the minimum behavior that makes the test pass.
6. Run the focused test again.
7. Run the cycle again for the next behavior.
8. Run the complete phase test file after all cycles reach green.
9. Run the relevant repository checks before the next phase.
10. Refactor only after the phase tests reach green.
11. Report the completed work in a brief summary.

## Scope

The work includes these features:

- A true 300 ms editor debounce.
- Markdown DSL conversion followed by semantic validation.
- One shared diagnostic type from `@justify/core`.
- A Validate tool with rich diagnostic cards.
- A shared ToolGuard component for tools that need a verified `System`.
- A last verified `System` that remains available after an invalid edit.
- A _Stale_ marker on tools that use an outdated `System`.
- A context-scoped model with no global model instance.
- Vitest model tests that use `useModel`, fake timers, and automatic cleanup.
- `@testing-library/preact` component and integration tests.

The work leaves these features outside its scope:

- Query execution in the Try tool.
- TeX rendering in the Preview tool.
- Navigation from diagnostic paths to editor locations.
- Browser persistence for the editor buffer.
- A special empty-buffer state (such a thing will not be implemented).

## Fixed library contracts

The implementation uses these public library APIs.

- `runPipeline(markdown: string, filename: string, extensions: Array<Extension>)` returns `{ extracted: System, diagnostics: Array<Diagnostic> }`.
- `validateSystem(system: System, filename: string)` returns an array of core `Diagnostic` objects.
- Both APIs produce `Diagnostic` objects from `@justify/core`.
- `ModuleErrorInfo` remains internal to `@justify/validator`. Its errors are surfaced using `Diagnostic`.
- Core `RichText` parts use `style: 'correct'` and `style: 'error'`.
- The Markdown DSL, core, and validator packages support direct browser bundling.

The Markdown pipeline uses this extension order:

1. `metadataExtension`
2. `syntaxExtension`
3. `relationMetaExtension`
4. `relationRuleExtension`

Both library calls use `<editor>` as the source name / filename.

## Target model contract

`packages/playground/models/live-system.ts` exposes the following public types and members.

```ts
export type LiveSystemState = { is: 'valid' } | { is: 'invalid'; diagnostics: Array<Diagnostic> };

export interface LiveSystemModel {
  editorBuffer: Signal<string>;
  state: ReadonlySignal<LiveSystemState>;
  verifiedSystem: ReadonlySignal<System | null>;
  outOfDate: ReadonlySignal<boolean>;
}

export const LiveSystemModelClass: ModelConstructor<LiveSystemModel, [string]>;
```

The members have these exact meanings:

- `editorBuffer` contains the current raw Markdown. The editor writes to this signal.
- `state` describes the latest completed validation attempt.
- `verifiedSystem` contains the last `System` that passed both validation phases.
- `outOfDate` indicates that the current editor revision has not passed validation.

`packages/playground/hooks/use-live-system.tsx` exposes a provider and a hook.

```ts
export function LiveSystemProvider(props: {
  model: LiveSystemModel;
  children: ComponentChildren;
}): JSX.Element;

export function useLiveSystem(): LiveSystemModel;
```

The application creates one model with `useModel`. It passes that model to `LiveSystemProvider`.

`useLiveSystem` returns the model from the nearest provider. It throws an error when no provider exists.

The model module does not export a live model instance. Each component tree owns its model.

The constructor processes the initial source before it returns the model.

- A valid initial source produces a valid state and a verified `System`.
- An invalid initial source produces an invalid state and a `null` verified `System`.

The model has no empty state. A whitespace-only buffer follows the normal Markdown path. It reports the missing metadata diagnostic.

The last verified `System` survives every invalid attempt. It also survives an empty buffer.

## Testing strategy

### Test seams

The tests use three public seams:

- The model seam exposes the public signals of a model created by `useModel`.
- The component seam exposes rendered DOM through `@testing-library/preact`.
- The integration seam exposes the editor, model, and tools through their public behavior.

Model tests use `renderHook` with `useModel`. The testing-library cleanup unmounts each hook and disposes its model.

Component tests create a model with `useModel`. They pass it through `LiveSystemProvider` to the component under test.

Tests do not inspect private model fields. They do not test private helper functions.

Tests do not call `Symbol.dispose` directly. They do not share a model between test cases.

### Test tools

Vitest runs all tests. The playground project uses the `jsdom` environment.

`@testing-library/preact` renders components and queries their DOM. The tests use `screen`, `within`, `fireEvent`, and `act` where needed.

Vitest fake timers control the 300 ms debounce. Timer changes occur inside `act` so Preact finishes each update before the next assertion.

Diagnostic tests use known literal `Diagnostic` objects. Expected values do not depend on production helper functions.

The unexpected-error tests replace the Markdown DSL and validator package boundaries with throwing implementations. They do not replace private model functions.

## Phase 1: Test harness, package wiring, and initial content

### Goal

The playground has a browser-like test harness. It can import the required libraries in a browser bundle. The editor starts with the simplest informative System possible.

### Target state

The playground package lists these development dependencies:

- `@testing-library/preact`
- `jsdom`

Note that dependencies to local packages (`@justify/validator`, `@justify/markdown-dsl`, etc) are automatically wired.

The target project includes `packages/playground/vitest.config.ts`. The root Vitest configuration includes the playground project.

The project uses the `jsdom` environment. Its `packages/playground/test-setup.ts` file calls `@testing-library/preact` cleanup after each test. The setup then restores real timers.

The target project includes a simple `base-system.jtf.md` file in `packages/playground/`. It contains a trimmed version of `packages/markdown-dsl/example-nat-system.jtf.md`. The file has no `equal` or `multiply` relations.

The application imports this file with `?raw`. It passes the file content to the model constructor.

The application creates the model with `useModel`. It passes the model through `LiveSystemProvider` to all tools.

The Edit tool calls `useLiveSystem`. It passes `editorBuffer` to the Editor component.

The Editor component uses CodeJar.

### Acceptance tests

The first vertical slice has two tests.

One `@testing-library/preact` test creates a model with `useModel`. It renders the provider and Edit tool. The test observes the base system in the editor.

The editor test uses a known line from `base-system.jtf.md`. It does not assert the complete editor text.

The second Vitest test uses `renderHook` with `useModel`. It observes that the initial model state is valid. The test also observes a verified `System`.

Start with the test harness and package dependencies. Write and run these tests. Confirm that they fail for the missing behavior. Add the minimum seed and initial validation.

### Success criteria

- The playground manifest declares both test dependencies.
- The root Vitest configuration includes the playground project.
- The playground test setup cleans the DOM after each test.
- The `packages/playground/base-system.jtf.md` file contains only the required content.
- The editor shows the base system after mount.
- The application passes one model through `LiveSystemProvider`.
- The initial model contains a valid `System`.
- The Edit tool acceptance test passes.
- The model has no global instance.
- Lint and formatting checks pass for the phase.
- The playground production build passes.
- The Editor and Edit tool contain only the required code.

## Phase 2: The live model

### Goal

The model processes editor revisions after a true debounce. It publishes one atomic result to every tool.

### Model construction

The model uses `createModel` from `@preact/signals`. It creates one effect that watches `editorBuffer`.

`LiveSystemModelClass` accepts the initial source as its constructor argument.

The application and tests create instances with `useModel`. The hook keeps one instance across renders. It disposes the instance when the component unmounts.

The model processes the initial source during construction. This avoids an empty first state and avoids duplicate work.

The first effect run does not schedule another initial timer.

### Debounce behavior

Each editor change starts a 300 ms timer. The effect cleanup cancels the previous timer before the next effect run.

This cleanup makes the delay a true debounce. Only the last edit in an idle period reaches the validation pipeline.

The timer runs the processing steps eagerly. The pipeline does not wait for a tool to read a lazy computed value.

During the debounce period:

- `state` continues to describe the latest completed attempt.
- `verifiedSystem` continues to contain the last successful `System`.
- `outOfDate` becomes `true` immediately.

The model uses revisions or an internal freshness flag for `outOfDate`. It does not compare buffer strings.

An edit back to the last verified text remains stale until a later successful validation. This rule also applies when the user clears and restores the buffer.

### Validation transaction

The timer captures the current editor value. It processes that exact value after the idle period.

The processing order has two phases:

1. The first phase runs `runPipeline` with the captured Markdown and the four fixed extensions.
2. When the Markdown phase produces no diagnostics, the second phase runs `validateSystem`.

A Markdown diagnostic ends the attempt. The partially extracted `System` does not enter semantic validation.

This short-circuit prevents secondary validator errors from an incomplete Markdown conversion.

A semantic validator diagnostic also ends the attempt as invalid.

A successful attempt updates these values in one Preact `batch`:

- `state` becomes `{ is: 'valid' }`.
- `verifiedSystem` becomes the newly extracted `System`.
- `outOfDate` becomes `false`.

An invalid attempt updates only `state`. It keeps the previous `verifiedSystem` and `outOfDate` values.

The batch prevents consumers from seeing a valid state with an old verified `System`.

### Error boundary

The Markdown DSL already catches errors inside each extension. The model adds outer catches as a last resort.

The pipeline catch produces one minimal Markdown DSL diagnostic. The validator catch produces one minimal validator diagnostic.

These last-resort diagnostics contain a short message and no stack trace. Their purpose is to keep the client alive.

An unexpected error makes the current attempt invalid. The model keeps the last verified `System` and continues to expose it as stale.

The library packages retain their public error behavior. The playground does not change their public APIs.

### Signal shape

The public `state`, `verifiedSystem`, and `outOfDate` members are read-only signal views. Internal signals hold the latest attempt, the verified record, and the freshness state.

The model effect cleanup cancels any active timer. Disposing the model runs this cleanup.

`useModel` performs that disposal when its component unmounts.

### Acceptance tests

The model test file uses `renderHook` with `useModel`. Each test creates an isolated model.

The testing-library cleanup unmounts the hook after each test. The cleanup disposes the model through `useModel`.

The tests do not call `Symbol.dispose` directly.

The model test file covers these behaviors:

- The initial base system produces a valid state and a verified system.
- An edit does not change the state before 300 ms.
- An edit changes the state after 300 ms.
- A later edit cancels an earlier timer.
- A Markdown error produces only Markdown DSL diagnostics.
- A semantic error produces validator diagnostics.
- An invalid attempt keeps the previous verified system.
- An editor change makes the model stale immediately.
- An invalid attempt keeps the model stale.
- A successful attempt clears the stale state.
- An undo to known-good text stays stale until validation succeeds.
- A whitespace-only buffer produces an invalid state and keeps the verified system.
- An unexpected Markdown DSL error produces an invalid diagnostic without removing the verified system.
- An unexpected validator error produces an invalid diagnostic without removing the verified system.

Write one test at a time. Run it and observe the expected failure before each implementation change.

### Success criteria

- One edit delays processing for exactly 300 ms.
- A later edit cancels the earlier timer.
- The model processes only the final buffer in a rapid edit sequence.
- `state` remains unchanged until the timer expires.
- `outOfDate` becomes `true` on the first editor change.
- A Markdown diagnostic prevents semantic validation.
- A successful attempt updates all public values atomically.
- An invalid attempt keeps the last verified `System`.
- `outOfDate` becomes `false` only after a successful attempt.
- Undoing to known-good text does not clear the stale state early.
- `useModel` owns each test model lifecycle.
- The model tests do not dispose models directly.
- The focused model test file passes.
- The production build resolves the workspace package imports.
- Lint and formatting checks pass for the phase.

## Phase 3: Diagnostic presentation

NOTE: Executing this phase requires loading the `daisyui` skill.

### Goal

The Validate tool shows each current diagnostic in a clear, consistent card.

### Rich text component

`packages/playground/components/rich-text.tsx` accepts a core `RichText` array.

It shows plain string parts without extra styling. It shows `correct` parts with bold success styling. It shows `error` parts with bold error styling.

### Location component

`packages/playground/components/location-path.tsx` accepts an array of string and number path segments.

The component uses a visual daisyUI breadcrumb. Each segment appears in path order. Segments appear as strings and are highlighted in a distinct color. The component contains no link destination. Path segments do not navigate the editor.

### Diagnostic card component

`packages/playground/components/diagnostic-card.tsx` accepts one core `Diagnostic`.

The card uses a compact modern design: `bg-base-200` background with a bold left `border-error` accent, no rounded corners, and an origin badge anchored bottom-right. The message is prefixed with "Error:". Location labels keep original casing.

The card contains these parts:

- A small origin badge.
- The rich diagnostic message.
- All diagnostic hints.
- All related locations.

The origin badge shows **Markdown DSL** or **Validator**. The card omits the validator error code.

A path location uses the visual breadcrumb component. A line-span location shows its start and end line numbers.

The card keeps each related-location label. Labels such as **In** and **Conflicts with** remain visible.

The card omits stack traces and raw exception details.

### Validate tool

`packages/playground/components/validate-tool.tsx` calls `useLiveSystem`. It reads `state.value` from that model.

A valid state shows a concise success message ("All good!"). An invalid state shows one diagnostic card for every diagnostic.

The Validate tool has no empty branch and no pending branch. It always shows the latest completed attempt.

The Markdown short-circuit means that a conversion error does not produce a cascade of semantic errors.

### Acceptance tests

The component tests use `@testing-library/preact`. They provide the model through `LiveSystemProvider`.

The tests cover these behaviors:

- Rich text shows plain, correct, and error parts with the expected text and classes.
- A location path shows every segment in order.
- A location path has no link destination.
- A diagnostic card shows its origin, message, hints, and related locations.
- A diagnostic card omits the validator error code.
- A path location uses the visual breadcrumb.
- A line-span location shows both line numbers.
- A valid state shows **All good!**.
- An invalid state shows one card for every diagnostic.

The tests use literal `Diagnostic` objects and literal `RichText` arrays. They do not create expected values through production code.

Write one test at a time. Run it and observe the expected failure before each component change.

### Success criteria

- Every diagnostic in an invalid state has one card.
- The card shows the message, hints, and related locations.
- The card identifies the diagnostic origin.
- The card omits validator error codes.
- Path locations appear as visual breadcrumbs.
- Line spans show both line numbers.
- A valid state shows a success message.
- The Validate tool handles the complete state union without an empty case.
- The focused component test file passes.
- Lint and formatting checks pass for the phase.

## Phase 4: Tool guard and verified tool consumers

### Goal

Tools that need a verified `System` share one fallback and one stale marker. Future tools can use the same contract.

### ToolGuard component

`packages/playground/components/tool-guard.tsx` calls `useLiveSystem`. It accepts ordinary JSX children.

Consider using the `For` and `Show` components from `@preact/signals`. They can show signal values efficiently.

The component contains no render-prop function and no callback child.

When `verifiedSystem` is `null`, ToolGuard shows this fallback message:

> Fix the validation errors first. Open the Validate tool.

When `verifiedSystem` exists, ToolGuard shows its children. The latest attempt can be invalid. The children still render.

When `outOfDate` is `true`, ToolGuard also shows a small warning badge with the label **Stale**. The badge uses `badge badge-warning badge-sm` styling.

The **Stale** badge describes the verified `System`. It does not describe the diagnostic state.

ToolGuard does not show diagnostic details. The Validate tool remains the only detailed diagnostic view.

### Try tool

`packages/playground/components/try-tool.tsx` calls `useLiveSystem`. It reads `verifiedSystem.value` from that model.

It passes its tool content to ToolGuard as ordinary JSX children.

The content shows the syntax and relation counts. It also states that query execution remains a placeholder.

Future Try actions use the last verified `System`. A stale `System` does not disable those actions.

### Preview tool

`packages/playground/components/preview-tool.tsx` calls `useLiveSystem`. It reads `verifiedSystem.value` from that model.

It passes its tool content to ToolGuard as ordinary JSX children.

The content shows the syntax count. It also states that rendering remains a placeholder.

Future Preview actions use the last verified `System`. A stale `System` does not disable those actions.

### Acceptance tests

The ToolGuard tests use `@testing-library/preact`. They provide the model through `LiveSystemProvider`.

The tests cover these behaviors:

- No verified system produces the fallback message.
- A verified system produces the tool children.
- A stale verified system produces both the children and the **Stale** badge.
- A current verified system does not produce the **Stale** badge.

The Try and Preview tests cover these behaviors:

- Both tools read the verified system from `useLiveSystem`.
- Try shows the syntax and relation counts.
- Preview shows the syntax count.
- Both tools keep their content while the verified system is stale.

The no-system scenario uses an invalid initial raw source at the file boundary.

### Integration acceptance tests

The integration tests render the Edit, Validate, Try, and Preview tools together. They use editor input events and fake timers.

The integration test file covers these behaviors:

- The editor starts with the base system.
- Validate shows **All good!** for the base system.
- Typing makes Try and Preview stale immediately.
- Rapid edits process only the final buffer.
- Malformed YAML produces a Markdown DSL error without semantic errors.
- A semantic error produces a **Validator** card without an error code.
- Repairing the source removes the **Stale** badge.
- Clearing the editor reports missing metadata and keeps the last verified system stale.

Each scenario mounts a fresh provider and model. The tests control public editor input and observable time only.

### Success criteria

- Try and Preview read the verified system through `useLiveSystem`.
- ToolGuard accepts JSX children without a function.
- If no verified system exists, ToolGuard shows the fallback.
- ToolGuard renders its children while the verified system is stale.
- The stale badge reads **Stale**.
- The stale badge uses warning styling.
- Try and Preview contain no direct duplication of fallback logic.
- An invalid edit does not remove the last verified system from either tool.
- The focused ToolGuard test file passes.
- The integration test file passes.
- Every integration scenario uses an isolated model.

### Final checks

Run these commands from the repository root in this order:

```sh
npm run lint
npm run fmt
npm test -- --run
npm run -w packages/playground build
```

The complete test suite includes every model, component, and integration test. The build proves that the browser bundle contains the library imports.

### Success criteria

- Lint, formatting, tests, and the production build pass.
- Every acceptance test has a named test.
- The tools update together after each completed validation attempt.

## Definition of done

- `LiveSystemModelClass` exposes the four agreed signal members.
- `LiveSystemState` contains only valid and invalid states.
- The model runs a true 300 ms debounce.
- The model processes Markdown and semantic validation in phases.
- The model keeps the last verified `System` after every invalid attempt.
- The stale state ends only after a successful validation attempt.
- The application passes one model through `LiveSystemProvider`.
- No model module exports a global model instance.
- `useModel` owns each model lifecycle in the application and tests.
- The Validate tool shows unified core diagnostics with visual breadcrumbs.
- The Validate tool omits validator error codes.
- ToolGuard provides the shared fallback and **Stale** badge.
- Try and Preview consume the last verified `System` through `useLiveSystem`.
- Query execution and TeX rendering remain placeholders.
- The playground Vitest project runs in `jsdom`.
- `@testing-library/preact` drives every component and integration test.
- Every acceptance test reached red before its implementation.
- The complete test suite, lint, formatting, and the production build pass.
