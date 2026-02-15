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
  let definedCommands: Record<TeXNamespace, Array<readonly [string, { readonly arguments: number, readonly definition: string }]>> = {
    grammar: [],
    relation: [],
    relationDescription: [],
    relationRule: [],
    relationRuleset: [],
    system: [
      // \jyDescription
      ['description', {
        arguments: 0,
        definition: `\\text{${system.description}}`,
      }],
      // \jyInfer{rule name}{premise1 \\ premise2 \\ ...}{conclusion}
      ['infer', {
        arguments: 3,
        definition: `\\dfrac{\\begin{array}{l} #2 \\end{array}}{ #3 } \\, \\text{[#1]}`,
      }],
    ],
  };

  // jg<category><constructor>{...}{...}... macros
  definedCommands.grammar =
    Object.entries(system.syntax).flatMap(([category, definition]) =>
      definition.grammar.map(grammar => [
        `${category}_${grammar.id}`, {
          arguments: grammar.arguments.length,
          definition: renderMixfix(
            grammar.fixity,
            grammar.tex_parts,
            Array.from({ length: grammar.arguments.length }, (_, i) => `#${i + 1}`),
          ),
        }
      ] as const)
    );

  /// jyGrammar formatting
  const grammarDef = Object.entries(system.syntax).flatMap(([category, definition], ix) => [
    // e ::= & constructor(...args) & description \\
    // On title lines it inserts an extra line with -5pt line spacing
    (ix === 0 ? '' : '\\\\[-5pt] ') + `& & \\textbf{${definition.description}}`,
    ...definition.grammar.map((grammar, ix) =>
      ((ix === 0) ? `${definition.suggestions.join(' , ')} \\mathrel{::=}` : '\\mid') +
      ` & ${commandOf('grammar', `${category}_${grammar.id}`, grammar.arguments.map(a => a.tex))}` +
      ` & \\text{${grammar.description}}`
    )
  ]);
  definedCommands.system.push([
    'grammar', {
      arguments: 0,
      definition:
        '\n  \\begin{array}{rll}\n    ' +
        grammarDef.join(' \\\\\n    ') +
        '\n  \\end{array}',
    }
  ]);

  // jr<relation>{...}{...}... macros
  definedCommands.relation =
    Object.entries(system.relations).map(([relation, definition]) => [
      relation, {
        arguments: definition.arguments.length,
        definition: renderMixfix(
          definition.fixity,
          definition.tex_parts,
          Array.from({ length: definition.arguments.length }, (_, i) => `#${i + 1}`),
        ),
      }
    ]);

  // \jrd<relation> macros
  definedCommands.relationDescription =
    Object.entries(system.relations).map(([relation, definition]) => [
      relation, {
        arguments: 0,
        definition: `
        \\boxed{
          \\begin{array}{c}
          ${commandOf('relation', relation, definition.arguments.map(a => a.tex))} \\\\
          \\text{${definition.description}}
          \\end{array}
        }`,
      }
    ]);

  // \jrrs<relation> macros
  definedCommands.relationRuleset =
    Object.entries(system.relations).map(([relation, definition]) => [
      relation, {
        arguments: 0,
        definition: definition.rules.map(r =>
          commandOf('relationRule', `${relation}_${r.rule.id}`)
        ).join(' \\allowbreak \\qquad '),
      }
    ]);

  // \jrr<relation><rule> macros
  definedCommands.relationRule =
    Object.entries(system.relations).flatMap(([relation, definition]) =>
      definition.rules.map(rule => [
        `${relation}_${rule.rule.id}`, {
          arguments: 0,
          definition: commandOf('system', 'infer', [
            rule.rule.tex,
            rule.premises.map(p =>
              commandOf('relation', p.relation, p.args.map(a => renderTerm(a, rule.variables, rule.literals)))
            ).join(' \\\\ '),
            commandOf('relation', relation, definition.arguments.map(a => renderTerm(rule.patterns[a.id], rule.variables, rule.literals))),
          ]),
        }
      ])
    );

  /// Render defined commands
  let output = '';
  for (const [namespace, commands] of Object.entries(definedCommands)) {
    output += `% Bindings from namespace '${namespace}'\n`;
    output += commands.map(([command, macro]) =>
      '\\newcommand{' +
      commandOf(namespace as TeXNamespace, command) +
      '}[' + macro.arguments + ']{' +
      macro.definition +
      '}\n'
    ).join('');
  }
  return output;
}

async function main() {
  if (process.argv.length !== 3) {
    console.error(`Wrong number of arguments.\nUsage: ${process.argv[1]} filename`);
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
