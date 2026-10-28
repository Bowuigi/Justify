import { useModel } from '@preact/signals';
import { render } from '@testing-library/preact';
import type { JSX } from 'preact/jsx-runtime';
import { describe, expect, it } from 'vitest';

import baseSystem from '../base-system.jtf.md?raw';
import { TexBlock } from '../components/tex-block.tsx';
import { LiveSystemProvider } from '../hooks/use-live-system.tsx';
import { LiveSystemModelClass } from '../models/live-system.ts';

function TestTexBlock({ expression }: { expression: string }): JSX.Element {
  const model = useModel(() => new LiveSystemModelClass(baseSystem));

  return (
    <LiveSystemProvider model={model}>
      <TexBlock expression={expression} />
    </LiveSystemProvider>
  );
}

describe('TexBlock', () => {
  it('renders a .katex element', () => {
    const { container } = render(<TestTexBlock expression={String.raw`\jrrsAdd`} />);
    expect(container.querySelector('.katex')).not.toBeNull();
  });

  it('renders no .katex-error element', () => {
    const { container } = render(<TestTexBlock expression={String.raw`\jrrsAdd`} />);
    expect(container.querySelector('.katex-error')).toBeNull();
  });
});
