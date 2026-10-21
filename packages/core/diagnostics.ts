export interface Diagnostic {
  /** The file this comes from */
  source: string;
  /** The Justify component this comes from */
  origin: DiagnosticOrigin;
  /** The error code, if applicable */
  code?: string;
  /** The message to be displayed */
  message: RichText;
  /** Hints to solve the issue */
  hints: Array<RichText>;
  /** Every related source location */
  relatedLocations: Array<DiagnosticRelatedLocation>;
}

/** The Justify component a `Diagnostic` comes from */
export type DiagnosticOrigin = 'markdown-dsl' | 'json-parsing' | 'validator';

/**
 * A source location related to a `Diagnostic`, like what source of truth it conflicts with or the
 * error location
 */
export interface DiagnosticRelatedLocation {
  /** How is this related to the diagnostic, in user-showable format. E.g. "In", "Conflicts with" */
  label: string;
  /** Where is this related location on the source file */
  location: DiagnosticLocation;
}

export type DiagnosticLocation =
  | { is: 'path'; path: Array<string | number> }
  | { is: 'line-span'; start: number; end: number };

export type RichText = Array<RichTextPart>;

export type RichTextPart =
  | { style: 'correct'; text: string }
  | { style: 'error'; text: string }
  | string;

export const highlightCorrect = (text: string): RichTextPart => ({ style: 'correct', text });
export const highlightError = (text: string): RichTextPart => ({ style: 'error', text });

/** Renders an iterable either as `singular: item` or as `plural: a, b or c` */
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
      for (const part of itemAsArray.slice(0, -2)) {
        head.push(part, ', ');
      }
      head.push(itemAsArray.at(-2)!);
      return [`${plural}: `, ...head, ' or ', itemAsArray.at(-1)!];
    }
  }
}
