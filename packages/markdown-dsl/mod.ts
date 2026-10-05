import type {
  Argument,
  Fixity,
  System,
  SystemRelation,
  SystemRelationRulePremise,
  Term,
} from '@justify/core';
import type { Code, Heading, Node } from 'mdast';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { frontmatterFromMarkdown } from 'mdast-util-frontmatter';
import { toString } from 'mdast-util-to-string';
import { frontmatter } from 'micromark-extension-frontmatter';
import { visit } from 'unist-util-visit';

import type {
  RelationCall,
  RelationRule,
  RelationMeta,
  Syntax,
  Metadata,
  Term as BlockTerm,
} from './codegen/types.d.ts';

export interface PreservedFields {
  provenance: { start: number; end: number };
}

export interface Block {
  type: 'block';
  scope: Array<string>;
  language: string;
  contents: string;
}

export interface ErrorBlock {
  type: 'error';
  message: string;
}

export type SystemBlocks =
  | Block
  | ErrorBlock
  | ({ type: 'syntax'; name: string } & Syntax)
  | ({ type: 'relation_meta'; name: string } & RelationMeta)
  | ({ type: 'relation_rule'; relation: string } & RelationRule)
  | ({ type: 'metadata' } & Metadata);

export interface Extension {
  handledLanguages: Array<string>;
  call: (input: Block) => Array<SystemBlocks>;
}

type SyntaxConvertible = Extract<
  SystemBlocks & PreservedFields,
  { type: 'syntax' | 'relation_meta' | 'relation_rule' | 'metadata' }
>;
type PipelineError = Omit<Extract<SystemBlocks & PreservedFields, { type: 'error' }>, 'type'>;

/** Extracts a code block list from a Markdown buffer */
// oxlint-disable-next-line max-lines-per-function
function parseMarkdown(markdown: Buffer): Array<(Block | ErrorBlock) & PreservedFields> {
  const tree = fromMarkdown(markdown, 'utf8', {
    extensions: [frontmatter(['yaml'])],
    mdastExtensions: [frontmatterFromMarkdown(['yaml'])],
  });

  const blocks: Array<(Block | ErrorBlock) & PreservedFields> = [];
  const headingStack: Array<string> = [];

  const metadata = tree.children.find(node => node.type === 'yaml');
  if (metadata === undefined) {
    blocks.push({
      type: 'error',
      message: 'No metadata provided at the start of the document',
      provenance: { start: 1, end: 1 },
    });
  } else {
    blocks.push({
      type: 'block',
      language: 'metadata',
      scope: [],
      provenance: { start: metadata.position!.start.line, end: metadata.position!.end.line },
      contents: metadata.value,
    });
  }

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
          type: 'block',
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

/** Infers fixity following the standard */
function inferFixity(
  argsLength: number,
  texPartsLength: number,
  firstAppearance: 'args' | 'parts' | null,
): Fixity {
  if (argsLength === 0 || texPartsLength === 0) {
    return 'none';
  }
  if (argsLength === texPartsLength + 1) {
    return 'infix';
  }
  if (argsLength === texPartsLength) {
    switch (firstAppearance) {
      case 'parts': {
        return 'prefix';
      }
      case 'args': {
        return 'postfix';
      }
      case null: {
        return 'none';
      }
    }
  }
  // `texPartsLength === argsLength + 1` or invalid cases
  return 'none';
}

/** Extracts a mixfix operator definition from the human-friendly is+where syntax */
function convertGrammarParts(grammarParts: { is: string; where?: Record<string, string> }): {
  fixity: Fixity;
  tex_parts: Array<string>;
  arguments: Array<{ id: string; tex: string; from: string }>;
} {
  const parts = grammarParts.is.split(' ');
  const texParts: Array<string> = [];
  const args: Array<{ id: string; tex: string; from: string }> = [];
  let firstPushed: 'args' | 'parts' | null = null;

  for (const part of parts) {
    if (/^[a-z][a-z0-9_]*$/.test(part) && grammarParts.where?.[part] !== undefined) {
      firstPushed ??= 'args';
      const partDef = grammarParts.where[part].split(' as ');
      args.push({
        id: part,
        tex: partDef[1] ?? part,
        from: partDef[0] ?? '<unknown>',
      });
    } else {
      firstPushed ??= 'parts';
      texParts.push(part);
    }
  }
  return {
    fixity: inferFixity(args.length, texParts.length, firstPushed),
    arguments: args,
    tex_parts: texParts,
  };
}

/** Annotates a term with `from` fields, using the available parts of the System file to infer them */
function convertTerm(system: System, declaration: Argument, term: BlockTerm): Term {
  if (term.is === 'ref') {
    return { is: 'ref', to: term.to };
  }
  const constructor = system.syntax[declaration.from]?.grammar.find(con => con.id === term.tag);
  const args = constructor?.arguments ?? [];
  return {
    is: 'con',
    from: declaration.from,
    tag: term.tag,
    args: term.args.map((arg, index) => convertTerm(system, args[index] ?? declaration, arg)),
  };
}

/** Extracts patterns from a rule's conclusion */
function convertPatterns(
  system: System,
  relation: SystemRelation,
  call: RelationCall,
): Record<string, Term> {
  const patterns: Record<string, Term> = {};
  for (const [index, declaration] of relation.arguments.entries()) {
    const term = call.args[index];
    if (term !== undefined) {
      patterns[declaration.id] = convertTerm(system, declaration, term);
    }
  }
  return patterns;
}

/** Extracts a premise array from a RelationCall array */
function convertPremises(
  system: System,
  calls: Array<RelationCall>,
): Array<SystemRelationRulePremise> {
  return calls.map(call => ({
    relation: call.rel,
    args: call.args.map((arg, index) =>
      convertTerm(
        system,
        system.relations[call.rel]?.arguments[index] ?? { from: 'literal', id: 'unknown', tex: '' },
        arg,
      ),
    ),
  }));
}

/** Extracts a System file from non-error code blocks, after running every extension */
// oxlint-disable-next-line max-lines-per-function
function convertToSystem(blocks: Array<SyntaxConvertible>): System {
  const system: System = {
    description: '',
    syntax: {},
    relations: {},
  };

  for (const block of blocks) {
    switch (block.type) {
      case 'metadata': {
        system.description = block.description;
        break;
      }
      case 'syntax': {
        system.syntax[block.name] = {
          description: block.desc,
          grammar: block.grammar.map(g => ({
            id: g.name,
            description: g.desc,
            ...convertGrammarParts(g),
          })),
          suggestions: block.suggest,
        };
        break;
      }
      case 'relation_meta': {
        system.relations[block.name] = {
          description: block.desc,
          rules: [],
          ...convertGrammarParts(block),
        };
        break;
      }
      case 'relation_rule': {
        const relation = system.relations[block.relation];
        if (relation === undefined) {
          break;
        }
        relation.rules.push({
          rule: block.rule,
          variables: block.variables,
          literals: block.literals,
          premises: convertPremises(system, block.premises),
          patterns: convertPatterns(system, relation, block.conclusion),
        });
        break;
      }
    }
  }

  return system;
}

/**
 * Extracts a System file (+ errors) from a Markdown buffer and an extension array. Each extension
 * is ran over the whole code block list in the given order. Do note that the System file may be
 * invalid, check with `@justify/validator`
 */
export function runPipeline(
  markdown: Buffer,
  extensions: Array<Extension>,
): { extracted: System; errors: Array<PipelineError> } {
  let processedInput: Array<SystemBlocks & PreservedFields> = parseMarkdown(markdown);

  for (const ext of extensions) {
    processedInput = processedInput.flatMap(original => {
      if (original.type === 'block' && ext.handledLanguages.includes(original.language)) {
        try {
          return ext
            .call(original)
            .map(replacement => ({ provenance: original.provenance, ...replacement }));
        } catch (error: unknown) {
          return {
            type: 'error',
            message: `Unhandled extension error: ${error}. This is most likely an extension bug`,
            provenance: original.provenance,
          };
        }
      }
      return original;
    });
  }

  const errors: Array<PipelineError> = [];
  const correct: Array<SyntaxConvertible> = [];
  for (const systemBlock of processedInput) {
    if (systemBlock.type === 'error') {
      errors.push({ message: systemBlock.message, provenance: systemBlock.provenance });
    } else if (systemBlock.type === 'block') {
      errors.push({
        message: `Unknown extension language ${systemBlock.language}. Maybe you forgot to enable an extension?`,
        provenance: systemBlock.provenance,
      });
    } else {
      correct.push(systemBlock);
    }
  }

  return {
    extracted: convertToSystem(correct),
    errors,
  };
}
