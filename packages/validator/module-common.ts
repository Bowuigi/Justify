export type SourceOfTruthPath =
  | ['system', 'relations']
  | ['system', 'relations', string, 'arguments']
  | ['system', 'relations', string, 'rules', number]
  | ['system', 'syntax']
  | ['system', 'syntax', string]
  | ['system', 'syntax', string, string, 'arguments']
  | ['query', 'relation'];

import type { RichText } from '../core/diagnostics.ts';

export type LocationPath =
  | ['system', 'relations', string]
  | ['system', 'relations', string, 'arguments', string]
  | ['system', 'relations', string, 'rules', string]
  | ['system', 'relations', string, 'rules', string, 'literals']
  | ['system', 'relations', string, 'rules', string, 'patterns']
  | ['system', 'relations', string, 'rules', string, 'patterns', string]
  | ['system', 'relations', string, 'rules', string, 'premises', number]
  | ['system', 'relations', string, 'rules', string, 'premises', number, 'arguments', number]
  | ['system', 'relations', string, 'rules', string, 'variables']
  | ['system', 'syntax', string]
  | ['system', 'syntax', string, 'grammar', string]
  | ['system', 'syntax', string, 'grammar', string, 'arguments']
  | ['system', 'syntax', string, 'grammar', string, 'arguments', string]
  | ['query']
  | ['query', 'args', number]
  | ['query', 'literals']
  | ['query', 'variables']
  | ['query-result', number, 'variables']
  | DTLocationPath;

export type DTLocationPath =
  | ['query-result', number, 'derivation', ...Array<number | 'premises' | 'arguments'>]
  | ['query-result', number, 'variables', string, ...Array<number | 'premises' | 'arguments'>];

export interface ErrorStack<T> {
  push: (error: T) => void;
}

export interface ModuleError<ModId extends string, ErrId extends string> {
  moduleId: ModId;
  id: `${ModId}-${ErrId}`;
  location: LocationPath;
  sourceOfTruthLocation: SourceOfTruthPath | null;
}

export type { RichText, RichTextPart } from '../core/diagnostics.ts';
export { highlightCorrect, highlightError, displayIterable } from '../core/diagnostics.ts';

export interface ModuleErrorInfo {
  id: string;
  message: RichText;
  hints: Array<RichText>;
  location: LocationPath;
  sourceOfTruthLocation: SourceOfTruthPath | null;
}
