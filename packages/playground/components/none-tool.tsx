import type { JSX } from 'preact/jsx-runtime';

export function NoneTool(): JSX.Element {
  return (
    <div class="p-4 w-full h-full text-sm text-base-content">
      <p>No tool selected</p>
    </div>
  );
}
