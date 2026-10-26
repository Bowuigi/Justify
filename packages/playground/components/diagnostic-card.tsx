import type { Diagnostic } from '@justify/core';
import type { JSX } from 'preact/jsx-runtime';

import { LocationPath } from './location-path.tsx';
import { RichText } from './rich-text.tsx';

interface DiagnosticCardProps {
  diagnostic: Diagnostic;
}

const ORIGIN_LABEL: Record<Diagnostic['origin'], string> = {
  'json-parsing': 'JSON parsing',
  'markdown-dsl': 'Markdown DSL',
  validator: 'Validator',
};

export function DiagnosticCard({ diagnostic }: DiagnosticCardProps): JSX.Element {
  const originLabel = ORIGIN_LABEL[diagnostic.origin];

  return (
    <div role="alert" class="alert alert-error">
      <div class="alert-body">
        <div class="flex flex-wrap gap-2 mb-3">
          <span class="badge badge-outline">{originLabel}</span>
        </div>
        <div class="mb-3">
          <RichText richText={diagnostic.message} />
        </div>
        {diagnostic.hints.map((hint, index) => (
          <div key={index} class="mb-2 text-sm opacity-75">
            <RichText richText={hint} />
          </div>
        ))}
        {diagnostic.relatedLocations.map((related, index) => (
          <div key={index} class="mb-2 text-sm">
            <span class="font-semibold">{related.label}</span>{' '}
            {related.location.is === 'path' ? (
              <LocationPath path={related.location.path} />
            ) : (
              <span>
                {related.location.start}-{related.location.end}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
