import type { System } from '@justify/core';
import { commandOf } from '@justify/tex-extractor';

export interface PreviewRelation {
  id: string;
  title: string;
  header: string;
  rules: string;
  hasRules: boolean;
}

export interface PreviewSections {
  description: string;
  grammar: string;
  relations: Array<PreviewRelation>;
}

export function humanizeIdentifier(id: string): string {
  return id
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function previewSections(system: System): PreviewSections {
  const relations: Array<PreviewRelation> = [];
  for (const [relationID, relation] of Object.entries(system.relations)) {
    relations.push({
      id: relationID,
      title: humanizeIdentifier(relationID),
      header: commandOf('relationDescription', relationID),
      rules: commandOf('relationRuleset', relationID),
      hasRules: relation.rules.length > 0,
    });
  }
  return {
    description: commandOf('system', 'description'),
    grammar: commandOf('system', 'grammar'),
    relations,
  };
}
