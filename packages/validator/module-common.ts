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

export interface ErrorStack<T> {
  push: (error: T) => void;
}

export interface ModuleError<ModId extends string, ErrId extends string> {
  moduleId: ModId;
  id: `${ModId}-${ErrId}`;
  location: LocationPath;
  sourceOfTruthLocation: SourceOfTruthPath | null;
}

export type RichTextPart =
  | string
  | { emphasis: 'good'; text: string }
  | { emphasis: 'bad'; text: string };

export type RichText = Array<RichTextPart>;

export interface ModuleErrorInfo {
  id: string;
  message: RichText;
  hints: Array<RichText>;
  location: LocationPath;
  sourceOfTruthLocation: SourceOfTruthPath | null;
}

export const highlightCorrect = (text: string): RichTextPart => ({ emphasis: 'good', text });
export const highlightWrong = (text: string): RichTextPart => ({ emphasis: 'bad', text });

export function displayIterable(
  singular: string,
  plural: string,
  item: Iterable<string>,
): RichText {
  const itemAsArray = [...item].map(x => highlightCorrect(x));
  switch (itemAsArray.length) {
    case 0: {
      return [`${plural}: <empty>`];
    }
    case 1: {
      return [`${singular}: `, itemAsArray[0]!];
    }
    default: {
      const head: RichText = [];
      for (const part of itemAsArray.slice(0, -1)) {
        head.push(part, ', ');
      }
      return [`${plural}: `, ...head, ' or ', itemAsArray.at(-1)!];
    }
  }
}
