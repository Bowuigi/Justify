export type Path =
  | ['system', 'relations']
  | ['system', 'relations', string, 'arguments']
  | ['system', 'relations', string, 'rules', number]
  | ['query', 'relation']
  ;

export type ErrorStack<T> = { push: (error: T) => void };

export interface ModuleError<ModId extends string, ErrId extends string> {
  moduleId: ModId,
  id: `${ModId}-${ErrId}`
  location: Path,
  sourceOfTruthLocation: Path | null,
}

export interface ModuleErrorInfo {
  message: string,
  hints: Array<string>,
  location: Path,
  sourceOfTruthLocation: Path | null,
};

export function displayIterable(singular: string, plural: string, item: Iterable<string>) {
  const itemAsArray = [...item];

  switch (itemAsArray.length) {
    case 0:
      return `${plural}: <empty>`;
    case 1:
      return `${singular}: ${itemAsArray[0]}`;
    default:
      return `${plural}: ${itemAsArray.slice(0, -1).join(', ')} and ${itemAsArray[itemAsArray.length - 1]}`
  }
}
