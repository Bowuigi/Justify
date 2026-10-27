import { extractTeX } from '@justify/tex-extractor';
import { useMemo } from 'preact/hooks';
import type { JSX } from 'preact/jsx-runtime';

import { useLiveSystem } from '../hooks/use-live-system.tsx';
import { previewSections } from '../lib/preview.ts';
import { TexBlock } from './tex-block.tsx';
import { ToolGuard } from './tool-guard.tsx';

export function PreviewTool(): JSX.Element {
  const { verifiedSystem } = useLiveSystem();
  const system = verifiedSystem.value;

  const preamble = useMemo(() => extractTeX(system), [system]);
  const sections = useMemo(() => previewSections(system), [system]);

  return (
    <ToolGuard>
      <div class="p-4 w-full h-full text-sm text-base-content" data-testid="preview-tool">
        <section>
          <h2 class="text-lg font-semibold">Description</h2>
          <TexBlock preamble={preamble} expression={sections.description} />
        </section>
        <hr />
        <section>
          <h2 class="text-lg font-semibold">Grammar</h2>
          <TexBlock preamble={preamble} expression={sections.grammar} />
        </section>
        <hr />
        <section>
          <h2 class="text-lg font-semibold">Relations</h2>
          {sections.relations.map(relation => {
            const header = (
              <div class="text-center">
                <TexBlock preamble={preamble} expression={relation.header} />
              </div>
            );
            const rules = relation.hasRules ? (
              <div class="preview-rules" data-testid={`rules-${relation.id}`}>
                <TexBlock preamble={preamble} expression={relation.rules} />
              </div>
            ) : (
              <p class="opacity-60 text-center">No rules defined</p>
            );
            return (
              <div key={relation.id} data-testid={`relation-${relation.id}`}>
                <h3 class="text-base font-semibold">{relation.title}</h3>
                {header}
                {rules}
              </div>
            );
          })}
        </section>
      </div>
    </ToolGuard>
  );
}
