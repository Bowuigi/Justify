import type { RichText as RichTextValue } from '@justify/core';
import type { JSX } from 'preact/jsx-runtime';

interface RichTextProps {
  richText: RichTextValue;
}

export function RichText({ richText }: RichTextProps): JSX.Element {
  return (
    <span>
      {richText.map((part, index) => {
        if (typeof part === 'string') {
          return <span key={index}>{part}</span>;
        }
        const classes =
          part.style === 'correct' ? 'font-bold text-success' : 'font-bold text-error';
        return (
          <span key={index} class={classes}>
            {part.text}
          </span>
        );
      })}
    </span>
  );
}
