import katex from 'katex';
import type { JSX } from 'preact/jsx-runtime';

import { useLiveSystem } from '../hooks/use-live-system.tsx';

export interface TexBlockProps {
  expression: string;
  class?: string;
}

export function TexBlock({ expression, class: className }: TexBlockProps): JSX.Element {
  const liveSystem = useLiveSystem();
  const preamble = liveSystem?.preamble.value;

  const html = katex.renderToString(`${preamble}\n${expression}`, {
    displayMode: true,
    throwOnError: false,
    trust: false,
  });

  return <div class={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
