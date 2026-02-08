import { Fixity, parseSystem, System, TexMathParts } from "../../formats/driver.ts";
import { default as process } from "node:process";

type TeXNamespace = 'system' | 'grammar' | 'relation' | 'relationDescription';

function snakeToCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function interleave<T>(arr1: T[], arr2: T[]): T[] {
  const result: T[] = [];
  for (let i = 0; i < Math.max(arr1.length, arr2.length); i++) {
    if (i < arr1.length) result.push(arr1[i]);
    if (i < arr2.length) result.push(arr2[i]);
  }
  return result;
}

function commandOf(namespace: TeXNamespace, invocation: string) {
  const mappings: Record<TeXNamespace, string> = { system: 'y', grammar: 'g', relation: 'r', relationDescription: 'rd' };
  return '\\' + snakeToCamel(`j${mappings[namespace]}_${invocation}`);
}

function renderMixfix(fixity: Fixity, texParts: TexMathParts, args: Array<string>): string {
  switch (fixity) {
    case 'none':
      return (texParts[0] || args[0]);
    case 'prefix':
      return interleave(texParts, args).join(' ');
    case 'infix':
      return interleave(args, texParts).join(' ');
    case 'postfix':
      return interleave(args, texParts).join(' ');
    default:
      throw new Error('Impossible. New fixity.');
  }
}

function extractTeX(system: System) {
  // Mutable store for type safety and centralization
  let definedCommands: Record<TeXNamespace, Record<string, { arguments: number, definition: string }>> = {
    system: {},
    grammar: {},
    relation: {},
    relationDescription: {},
  };

  // jyDescription
  definedCommands.system.description = {
    arguments: 0,
    definition: `\\text{${system.description}}`,
  };

  /// jyGrammar formatting and jg... constructors
  const grammarDef: Array<string> = [];
  for (const [category, definition] of Object.entries(system.syntax)) {
    const categorySpacing = grammarDef.length === 0 ? '' : '\\\\[-5pt]';
    grammarDef.push(`${categorySpacing} && \\textbf{${definition.description}} \\\\ `);

    for (const [index, grammar] of Object.entries(definition.grammar)) {
      definedCommands.grammar[`${category}_${grammar.id}`] = {
        arguments: grammar.arguments.length,
        definition: renderMixfix(
          grammar.fixity,
          grammar.tex_parts,
          Array.from({ length: grammar.arguments.length }, (_, i) => `#${i + 1}`),
        ),
      };

      if (index === '0') {
        grammarDef.push(
          `${definition.suggestions.join(' , ')} \\mathrel{::=} ` +
          `& ${commandOf('grammar', `${category}_${grammar.id}`)}` +
          `{${grammar.arguments.map(a => a.tex).join('}{')}} ` +
          `& \\text{${grammar.description}} \\\\`
        );
      } else {
        grammarDef.push(
          '\\mid ' +
          `& ${commandOf('grammar', `${category}_${grammar.id}`)}` +
          `{${grammar.arguments.map(a => a.tex).join('}{')}} ` +
          `& \\text{${grammar.description}} \\\\`
        );
      }
    }
  }
  grammarDef.push()
  definedCommands.system.grammar = {
    arguments: 0,
    definition:
      '\n  \\begin{array}{rll}\n    ' +
      grammarDef.join('\n    ') +
      '\n  \\end{array}',
  };

  /// TODO: Render relations (requires term rendering)
  for (const [relation, definition] of Object.entries(system.relations)) {
    definedCommands.relation[relation] = {
      arguments: definition.arguments.length,
      definition: renderMixfix(
        definition.fixity,
        definition.tex_parts,
        Array.from({ length: definition.arguments.length }, (_, i) => `#${i + 1}`),
      ),
    };

    // Relation showcase with description
    definedCommands.relationDescription[relation] = {
      arguments: 0,
      definition: `
      \\boxed{
        \\begin{array}{c}
        ${commandOf('relation', relation)}{${definition.arguments.map(a => a.tex).join('}{')}} \\\\
        \\text{${definition.description}}
        \\end{array}
      }`
    };
  }

  /// Render defined commands
  let output = '';
  for (const [namespace, commands] of Object.entries(definedCommands)) {
    for (const [command, macro] of Object.entries(commands)) {
      output += `\\newcommand{${commandOf(namespace as TeXNamespace, command)}}[${macro.arguments}]{${macro.definition}}\n`;
    }
  }
  return output;
}

async function main() {
  if (process.argv.length !== 3) {
    console.error(
      `Wrong number of arguments.\nUsage: ${process.argv[1]} filename`,
    );
    process.exitCode = 1;
    return;
  }

  const [_node, _source, filename] = process.argv;

  const system = await parseSystem(filename);
  if (system === null) {
    process.exitCode = 1;
    return;
  }
  console.log(extractTeX(system));
}
main();
