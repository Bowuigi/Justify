import './app.css';
import { signal } from '@preact/signals';
import { render, type JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';

import { EditTool } from './components/edit-tool.tsx';
import { NoneTool } from './components/none-tool.tsx';
import { PreviewTool } from './components/preview-tool.tsx';
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
    <div class={class_ ?? ''}>
      <div>
        <select
          class="select"
          value={tool}
          onChange={ev => {
            pick(ev.currentTarget.value as ToolID);
          }}>
          {Object.entries(toolMapping).map(([otherID, otherDef]) => (
            <option
              key={otherID}
              value={otherID}
              disabled={otherID !== tool && usedTools.value.has(otherID as ToolID)}>
              {otherDef.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Tool />
      </div>
    </div>
  );
}

const layoutMapping = {
  single: {
    label: 'Single',
    tree: () => (
      <div class="grid h-full grid-cols-1 grid-rows-1">
        <Pane initialTool="edit" />
      </div>
    ),
  },
  sideBySide: {
    label: 'Side by side',
    tree: () => (
      <div class="grid h-full grid-cols-2 grid-rows-1">
        <Pane initialTool="edit" />
        <Pane initialTool="preview" />
      </div>
    ),
  },
  stacked: {
    label: 'Stacked',
    tree: () => (
      <div class="grid h-full grid-cols-1 grid-rows-2">
        <Pane initialTool="edit" />
        <Pane initialTool="validate" />
      </div>
    ),
  },
  grid: {
    label: '2x2 grid',
    tree: () => (
      <div class="grid h-full grid-cols-2 grid-rows-2">
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
      <div class="grid h-full grid-cols-2 grid-rows-2">
        <Pane initialTool="edit" class="row-span-2" />
        <Pane initialTool="preview" />
        <Pane initialTool="try" />
      </div>
    ),
  },
} as const;

type LayoutID = keyof typeof layoutMapping;

function App(): JSX.Element {
  const [layoutID, setLayoutID] = useState<LayoutID>('sideBySide');
  const Tree = layoutMapping[layoutID].tree;

  const changeLayout = (id: LayoutID): void => {
    usedTools.value = new Set();
    setLayoutID(id);
  };

  return (
    <div>
      <nav>
        <select
          class="select"
          value={layoutID}
          onChange={ev => {
            changeLayout(ev.currentTarget.value as LayoutID);
          }}>
          {Object.entries(layoutMapping).map(([otherID, otherDef]) => (
            <option key={otherID} value={otherID}>
              {otherDef.label}
            </option>
          ))}
        </select>
      </nav>
      <Tree />
    </div>
  );
}

render(<App />, document.querySelector('#app')!);
