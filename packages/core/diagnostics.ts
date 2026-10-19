export interface Diagnostic {
  source: string;
  origin: DiagnosticOrigin;
  code?: string;
  message: RichText;
  hints: Array<RichText>;
  relatedLocations: Array<DiagnosticRelatedLocation>;
}

export type DiagnosticOrigin = 'markdown-dsl' | 'json-parsing' | 'validator';

export type DiagnosticLocation =
  | { is: 'path'; path: Array<string | number> }
  | { is: 'line-span'; start: number; end: number };

export interface DiagnosticRelatedLocation {
  label: string;
  location: DiagnosticLocation;
}

export type RichText = Array<RichTextPart>;

export type RichTextPart =
  | { style: 'correct'; text: string }
  | { style: 'error'; text: string }
  | string;
