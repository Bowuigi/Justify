import './app.css';
import { signal } from '@preact/signals';
import { render, type JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';

import { EditTool } from './components/edit-tool.tsx';
import { NoneTool } from './components/none-tool.tsx';
import { PreviewTool } from './components/preview-tool.tsx';
import { ThemePicker } from './components/theme-picker.tsx';
import { TryTool } from './components/try-tool.tsx';
import { ValidateTool } from './components/validate-tool.tsx';

const toolMapping = {
  edit: { label: 'Edit', component: EditTool },
  try: { label: 'Try', component: TryTool },
  preview: { label: 'Preview', component: PreviewTool },
  validate: { label: 'Validate', component: ValidateTool },
  none: { label: 'None', component: NoneTool },
} as const;

type ToolID = keyof typeof toolMapping;

const usedTools = signal<ReadonlySet<ToolID>>(new Set());

function transitionToolUsage(from: ToolID, to: ToolID): boolean {
  if (from === to) return true;

  const used = usedTools.value;

  if (used.has(to)) return false;

  const updated = new Set(used);
  updated.delete(from);
  updated.add(to);
  usedTools.value = updated;

  return true;
}

function Pane({
  initialTool,
  class: class_,
}: {
  initialTool: ToolID;
  class?: string;
}): JSX.Element {
  const [tool, setTool] = useState<ToolID>(initialTool);
  useEffect(() => {
    usedTools.value = new Set(usedTools.value).add(initialTool);
  }, []);

  const pick = (next: ToolID): void => {
    if (!transitionToolUsage(tool, next)) return;
    setTool(next);
  };

  const Tool = toolMapping[tool].component;

  return (
    <div
      class={`card bg-base-100 rounded-none h-full min-h-0 flex flex-col overflow-hidden ${class_ ?? ''}`}>
      <div class="flex items-center gap-1 bg-base-200 px-2 pt-1">
        <select
          class="select select-sm font-semibold rounded-b-none border-none"
          value={tool}
          onChange={ev => {
            pick(ev.currentTarget.value as ToolID);
          }}>
          {Object.entries(toolMapping).map(([otherID, otherDef]) => (
            <option
              class="m-0"
              key={otherID}
              value={otherID}
              disabled={otherID !== tool && usedTools.value.has(otherID as ToolID)}>
              {otherDef.label}
            </option>
          ))}
        </select>
      </div>
      <div class="min-h-0 flex-1 overflow-auto">
        <Tool />
      </div>
    </div>
  );
}

const layoutMapping = {
  single: {
    label: 'Single',
    tree: () => (
      <div class="grid h-full grid-cols-1 grid-rows-1 gap-0.5 bg-transparent">
        <Pane initialTool="edit" />
      </div>
    ),
  },
  sideBySide: {
    label: 'Side by side',
    tree: () => (
      <div class="grid h-full grid-cols-2 grid-rows-1 gap-0.5 bg-transparent">
        <Pane initialTool="edit" />
        <Pane initialTool="preview" />
      </div>
    ),
  },
  stacked: {
    label: 'Stacked',
    tree: () => (
      <div class="grid h-full grid-cols-1 grid-rows-2 gap-0.5 bg-transparent">
        <Pane initialTool="edit" />
        <Pane initialTool="validate" />
      </div>
    ),
  },
  grid: {
    label: '2x2 grid',
    tree: () => (
      <div class="grid h-full grid-cols-2 grid-rows-2 gap-0.5 bg-base-300">
        <Pane initialTool="edit" />
        <Pane initialTool="preview" />
        <Pane initialTool="validate" />
        <Pane initialTool="try" />
      </div>
    ),
  },
  mainStack: {
    label: 'Main + stack',
    tree: () => (
      <div class="grid h-full grid-cols-2 grid-rows-2 gap-0.5 bg-base-300">
        <Pane initialTool="edit" class="row-span-2" />
        <Pane initialTool="preview" />
        <Pane initialTool="try" />
      </div>
    ),
  },
} as const;

type LayoutID = keyof typeof layoutMapping;

function LayoutPicker({
  layoutID,
  onChange,
}: {
  layoutID: LayoutID;
  onChange: (id: LayoutID) => void;
}): JSX.Element {
  return (
    <select
      class="select select-sm select-ghost"
      value={layoutID}
      onChange={ev => {
        onChange(ev.currentTarget.value as LayoutID);
      }}>
      {Object.entries(layoutMapping).map(([otherID, otherDef]) => (
        <option key={otherID} value={otherID}>
          {otherDef.label}
        </option>
      ))}
    </select>
  );
}

function App(): JSX.Element {
  const [layoutID, setLayoutID] = useState<LayoutID>('sideBySide');
  const Tree = layoutMapping[layoutID].tree;

  const changeLayout = (id: LayoutID): void => {
    usedTools.value = new Set();
    setLayoutID(id);
  };

  return (
    <div class="flex h-dvh flex-col text-base-content">
      <nav class="navbar min-h-0 border-b border-base-300 bg-base-300 px-2 py-1.5">
        <div class="navbar-start">
          <LayoutPicker layoutID={layoutID} onChange={changeLayout} />
        </div>
        <div class="navbar-end">
          <ThemePicker />
        </div>
      </nav>
      <div class="min-h-0 flex-1 bg-base-300 overflow-hidden">
        <Tree />
      </div>
    </div>
  );
}

render(<App />, document.querySelector('#app')!);
