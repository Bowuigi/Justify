import type { Code, Heading, Node } from 'mdast';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { frontmatterFromMarkdown } from 'mdast-util-frontmatter';
import { toString } from 'mdast-util-to-string';
import { frontmatter } from 'micromark-extension-frontmatter';
import { visit } from 'unist-util-visit';

import type { RelationMeta, Syntax } from './codegen/types.d.ts';

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
  | ({ type: 'syntax' } & Syntax)
  | ({ type: 'relation_meta' } & RelationMeta)
  | { type: 'error'; message: string };

export interface Extension {
  handledLanguages: Array<string>;
  call: (input: Block) => Array<SystemBlocks>;
}

export type Pipeline = (input: Block & PreservedFields) => Array<SystemBlocks & PreservedFields>;

function extractBlocks(markdown: Buffer): Array<Block & PreservedFields> {
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

export function runPipeline(
  markdown: Buffer,
  extensions: Array<Extension>,
): Array<SystemBlocks & PreservedFields> {
  let result: Array<SystemBlocks & PreservedFields> = extractBlocks(markdown).map(b => ({
    type: 'block',
    ...b,
  }));

  for (const ext of extensions) {
    result = result.flatMap(original => {
      if (original.type === 'block' && ext.handledLanguages.includes(original.language)) {
        return ext
          .call(original)
          .map(replacement => ({ provenance: original.provenance, ...replacement }));
      }
      return original;
    });
  }
  return result;
}
