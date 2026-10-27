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
    <div role="alert" class="relative bg-base-200 border-l-4 border-error pl-3 pr-3 py-2 text-sm">
      <div class="flex items-center gap-1">
        <span class="font-semibold text-error shrink-0">Error:</span>
        <div class="flex-1">
          <RichText richText={diagnostic.message} />
        </div>
      </div>
      {diagnostic.hints.length > 0 && (
        <div class="mt-1 text-base-content/70">
          {diagnostic.hints.map((hint, index) => (
            <div key={index} class="text-xs">
              <RichText richText={hint} />
            </div>
          ))}
        </div>
      )}
      {diagnostic.relatedLocations.length > 0 && (
        <div class="mt-1 space-y-0.5">
          {diagnostic.relatedLocations.map((related, index) => (
            <div key={index} class="flex items-baseline gap-2 text-sm">
              <span class="font-medium text-base-content/80 shrink-0">{related.label}:</span>
              <div class="min-w-0 flex-1">
                {related.location.is === 'path' ? (
                  <LocationPath path={related.location.path} />
                ) : (
                  <span>
                    {'Lines '}
                    <span class="text-primary">{related.location.start}</span>
                    {' - '}
                    <span class="text-primary">{related.location.end}</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <span class="badge badge-error badge-sm absolute bottom-2 right-2">{originLabel}</span>
    </div>
  );
}
