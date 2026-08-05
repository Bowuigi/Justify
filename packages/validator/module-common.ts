// deno-lint-ignore no-external-import
import { styleText } from 'node:util';

export type SourceOfTruthPath =
  | ['system', 'relations']
  | ['system', 'relations', string, 'arguments']
  | ['system', 'relations', string, 'rules', number]
  | ['system', 'syntax']
  | ['system', 'syntax', string]
  | ['system', 'syntax', string, string, 'arguments']
  | ['query', 'relation'];

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

export type ErrorStack<T> = { push: (error: T) => void };

export interface ModuleError<ModId extends string, ErrId extends string> {
  moduleId: ModId;
  id: `${ModId}-${ErrId}`;
  location: LocationPath;
  sourceOfTruthLocation: SourceOfTruthPath | null;
}

export interface ModuleErrorInfo {
  id: string;
  message: string;
  hints: Array<string>;
  location: LocationPath;
  sourceOfTruthLocation: SourceOfTruthPath | null;
}

export const highlight = (str: string): string => styleText(['bold', 'green'], str);
export const highlightWrong = (str: string): string => styleText(['bold', 'red'], str);

export function displayIterable(singular: string, plural: string, item: Iterable<string>): string {
  const itemAsArray = [...item].map(highlight);

  switch (itemAsArray.length) {
    case 0:
      return `${plural}: <empty>`;
    case 1:
      return `${singular}: ${itemAsArray[0]}`;
    default:
      return `${plural}: ${itemAsArray.slice(0, -1).join(', ')} or ${
        itemAsArray[itemAsArray.length - 1]
      }`;
  }
}
