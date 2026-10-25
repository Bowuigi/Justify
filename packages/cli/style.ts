import { stderr, stdout } from 'node:process';
import { styleText } from 'node:util';

const styles = {
  success: ['bold', 'green'],
  correct: ['bold', 'green'],
  error: ['bold', 'red'],
  path: 'yellow',
  lineNumber: 'yellow',
  variable: 'magenta',
  literal: 'yellow',
  constructor: 'blue',
  rule: 'green',
  relation: 'cyan',
  derivation: 'gray',
  separator: 'bold',
} as const;

export type StyleName = keyof typeof styles;

export function styleOut(name: StyleName, text: string): string {
  return styleText(styles[name], text, { stream: stdout });
}

export function styleErr(name: StyleName, text: string): string {
  return styleText(styles[name], text, { stream: stderr });
}
