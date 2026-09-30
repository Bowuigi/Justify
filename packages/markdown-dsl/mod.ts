import type { System } from '@justify/core';
import type { Code, Heading, Node } from 'mdast';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { frontmatterFromMarkdown } from 'mdast-util-frontmatter';
import { toString } from 'mdast-util-to-string';
import { frontmatter } from 'micromark-extension-frontmatter';
import { visit } from 'unist-util-visit';

import type { RelationRule, RelationMeta, Syntax } from './codegen/types.d.ts';

export interface PreservedFields {
  provenance: { start: number; end: number };
}

export interface Block {
  scope: Array<string>;
  language: string;
  contents: string;
}

export type SystemBlocks =
  | ({ type: 'block' } & Block)
  | ({ type: 'syntax'; name: string } & Syntax)
  | ({ type: 'relation_meta'; name: string } & RelationMeta)
  | ({ type: 'relation_rule'; relation: string } & RelationRule)
  | { type: 'error'; message: string };

export interface Extension {
  handledLanguages: Array<string>;
  call: (input: Block) => Array<SystemBlocks>;
}

type SyntaxConvertible = Extract<SystemBlocks & PreservedFields, { type: 'syntax' | 'relation_meta' | 'relation_rule' }>;
type PipelineError = Omit<Extract<SystemBlocks & PreservedFields, {type: 'error'}>, 'type'>;

function parseMarkdown(markdown: Buffer): Array<Block & PreservedFields> {
  const tree = fromMarkdown(markdown, 'utf8', {
    extensions: [frontmatter(['yaml'])],
    mdastExtensions: [frontmatterFromMarkdown(['yaml'])],
  });

  const blocks: Array<Block & PreservedFields> = [];
  const headingStack: Array<string> = [];

  visit(tree, (node: Node) => {
    if (node.type === 'heading') {
      const heading = node as Heading;

      const title = toString(heading).trim().toLowerCase();

      // Drop deeper headings
      headingStack[heading.depth - 1] = title;
      headingStack.length = heading.depth;
    }

    if (node.type === 'code') {
      const codeNode = node as Code;
      const lang = codeNode.lang ?? '';

      if (lang.startsWith('jtf-')) {
        blocks.push({
          scope: headingStack.filter(Boolean),
          language: lang.slice(4),
          contents: codeNode.value,
          provenance: {
            start: codeNode.position!.start.line,
            end: codeNode.position!.end.line,
          },
        });
      }
    }
  });

  return blocks;
}

function convertToSystem(description: string, blocks: Array<SyntaxConvertible>): System {
  const system: System = {
    description,
    syntax: {},
    relations: {},
  };

  for (const block of blocks) {
    switch (block.type) {
      case 'syntax': {
        system.syntax[block.name] = {
          description: block.desc,
          grammar: block.grammar.map(b => {
            return {
              id: b.name,
              description: b.desc,
              arguments: 3,
              fixity: 3,
              tex_parts: 3,
            };
          }),
          suggestions: block.suggest,
        };
        break;
      }
      case 'relation_meta': {
        system.relations[block.name] = {
          description: block.desc,
          rules: [],
          arguments: 3,
          fixity: 3,
          tex_parts: 3,
        };
        break;
      }
      case 'relation_rule': {
        system.relations[block.relation].rules.push({
          rule: block.rule,
          variables: block.variables,
          literals: block.literals,
          premises: 4,
          patterns: 4,
        });
        break;
      }
    }
  }

  return system;
}

export function runPipeline(
  markdown: Buffer,
  extensions: Array<Extension>,
): {extracted: System, errors: Array<PipelineError>} {
  let processedInput: Array<SystemBlocks & PreservedFields> = parseMarkdown(markdown).map(b => ({
    type: 'block',
    ...b,
  }));

  for (const ext of extensions) {
    processedInput = processedInput.flatMap(original => {
      if (original.type === 'block' && ext.handledLanguages.includes(original.language)) {
        return ext
          .call(original)
          .map(replacement => ({ provenance: original.provenance, ...replacement }));
      }
      return original;
    });
  }

  const errors: Array<PipelineError> = [];
  const correct: Array<SyntaxConvertible> = [];
  for (const systemBlock of processedInput) {
    if (systemBlock.type === 'error') {
      errors.push({message: systemBlock.message, provenance: systemBlock.provenance});
    } else if (systemBlock.type === 'block') {
      errors.push({message: `Unknown extension language ${systemBlock.language}. Maybe you forgot to enable an extension?`, provenance: systemBlock.provenance});
    } else {
      correct.push(systemBlock);
    }
  }

  return {
    extracted: convertToSystem('TODO', correct),
    errors: errors,
  };
}
