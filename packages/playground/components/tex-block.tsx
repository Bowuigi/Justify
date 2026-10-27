import katex from 'katex';
import type { JSX } from 'preact/jsx-runtime';

export interface TexBlockProps {
  preamble: string;
  expression: string;
  class?: string;
}

export function TexBlock({ preamble, expression, class: className }: TexBlockProps): JSX.Element {
  const html = katex.renderToString(`${preamble}\n${expression}`, {
    displayMode: true,
    throwOnError: false,
  });

  return <div class={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
