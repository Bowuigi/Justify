import { Fixity, parseSystem, System, Term, TexMath, TexMathParts } from "../../formats/driver.ts";
import { default as process } from "node:process";

type TeXNamespace = 'system' | 'grammar' | 'relation' | 'relationDescription' | 'relationRule' | 'relationRuleset';

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

function commandOf(namespace: TeXNamespace, invocation: string, args?: Array<string>) {
  const mappings: Record<TeXNamespace, string> = { system: 'y', grammar: 'g', relation: 'r', relationDescription: 'rd', relationRule: 'rr', relationRuleset: 'rrs' };
  const renderedArgs = (args === undefined) ? '' : ('{' + args.join('}{') + '}');
  return '\\' + snakeToCamel(`j${mappings[namespace]}_${invocation}`) + renderedArgs;
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

function renderTerm(term: Term, variables: Record<string, TexMath>, literals: Record<string, TexMath>): string {
  switch (term.is) {
    case 'ref':
      return variables[term.to] || literals[term.to] || `<Ref ${term.to} unbound>`
    case 'con':
      return commandOf(
        'grammar',
        `${term.from}_${term.tag}`,
        term.args.map(a => renderTerm(a, variables, literals))
      );
  }
}

// TODO: Refactor this into a bunch of `.map()` calls
//       If the asymptotic complexity becomes a problem, those maps can be fused. 
function extractTeX(system: System) {
  // Mutable store for type safety and centralization
  let definedCommands: Record<TeXNamespace, Record<string, { arguments: number, definition: string }>> = {
    system: {},
    grammar: {},
    relation: {},
    relationDescription: {},
    relationRule: {},
    relationRuleset: {},
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

    for (const [index, grammar] of definition.grammar.entries()) {
      definedCommands.grammar[`${category}_${grammar.id}`] = {
        arguments: grammar.arguments.length,
        definition: renderMixfix(
          grammar.fixity,
          grammar.tex_parts,
          Array.from({ length: grammar.arguments.length }, (_, i) => `#${i + 1}`),
        ),
      };

      if (index === 0) {
        grammarDef.push(
          `${definition.suggestions.join(' , ')} \\mathrel{::=} ` +
          `& ${commandOf('grammar', `${category}_${grammar.id}`, grammar.arguments.map(a => a.tex))}` +
          `& \\text{${grammar.description}} \\\\`
        );
      } else {
        grammarDef.push(
          '\\mid ' +
          `& ${commandOf('grammar', `${category}_${grammar.id}`, grammar.arguments.map(a => a.tex))}` +
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
        ${commandOf('relation', relation, definition.arguments.map(a => a.tex))} \\\\
        \\text{${definition.description}}
        \\end{array}
      }`
    };

    definedCommands.relationRuleset[relation] = {
      arguments: 0,
      definition: definition.rules.map(r =>
        commandOf('relationRule', `${relation}_${r.rule.id}`)
      ).join(' \\allowbreak \\qquad '),
    };

    for (const rule of definition.rules) {
      definedCommands.relationRule[`${relation}_${rule.rule.id}`] = {
        arguments: 0,
        definition: `
        \\dfrac{
          \\begin{array}{l}
          ${rule.premises.map(p =>
          commandOf(
            'relation',
            p.relation,
            p.args.map(a => renderTerm(a, rule.variables, rule.literals))
          )
        ).join(' \\\\ ')}
          \\end{array}
        }{
          ${commandOf(
            'relation',
            relation,
            definition.arguments.map(a => renderTerm(rule.patterns[a.id], rule.variables, rule.literals))
          )}
        } \\, \\text{[${rule.rule.tex}]}`,
      };
    }
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
