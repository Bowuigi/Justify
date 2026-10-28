import type {
  Derivation,
  DerivationTerm,
  Fixity,
  System,
  Term,
  TexMath,
  TexMathParts,
} from '@justify/core';

export type TeXNamespace =
  | 'system'
  | 'grammar'
  | 'relation'
  | 'relationDescription'
  | 'relationRule'
  | 'relationRuleset';

function snakeToCamel(s: string): string {
  return s.replaceAll(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function interleave<T>(arr1: Array<T>, arr2: Array<T>): Array<T> {
  const result: Array<T> = [];
  for (let i = 0; i < Math.max(arr1.length, arr2.length); i++) {
    if (i < arr1.length) result.push(arr1[i]!);
    if (i < arr2.length) result.push(arr2[i]!);
  }
  return result;
}

export function commandOf(
  namespace: TeXNamespace,
  invocation: string,
  args?: Array<string>,
): string {
  const mappings: Record<TeXNamespace, string> = {
    system: 'y',
    grammar: 'g',
    relation: 'r',
    relationDescription: 'rd',
    relationRule: 'rr',
    relationRuleset: 'rrs',
  };
  const renderedArgs = args === undefined ? '' : `{${args.join('}{')}}`;
  return `\\${snakeToCamel(`j${mappings[namespace]}_${invocation}`)}${renderedArgs}`;
}

export interface TeXScope {
  variables: Record<string, TexMath>;
  literals: Record<string, TexMath>;
}

function renderMixfix(fixity: Fixity, texParts: TexMathParts, args: Array<string>): string {
  switch (fixity) {
    case 'none': {
      if (texParts.length === 0) {
        return args[0]!;
      }
      return interleave(texParts, args).join(' ');
    }
    case 'prefix': {
      return interleave(texParts, args).join(' ');
    }
    case 'infix': {
      return interleave(args, texParts).join(' ');
    }
    case 'postfix': {
      return interleave(args, texParts).join(' ');
    }
    default: {
      throw new Error('Impossible. New fixity.');
    }
  }
}

function renderTerm(
  term: Term,
  variables: Record<string, TexMath>,
  literals: Record<string, TexMath>,
): string {
  switch (term.is) {
    case 'ref': {
      return variables[term.to] ?? literals[term.to] ?? `<Ref ${term.to} unbound>`;
    }
    case 'con': {
      return commandOf(
        'grammar',
        `${term.from}_${term.tag}`,
        term.args.map(a => renderTerm(a, variables, literals)),
      );
    }
  }
}
export function extractDerivationTermTeX(term: DerivationTerm, scope: TeXScope): string {
  switch (term.is) {
    case 'con': {
      return commandOf(
        'grammar',
        `${term.from}_${term.tag}`,
        term.args.map(arg => extractDerivationTermTeX(arg, scope)),
      );
    }
    case 'lit': {
      return scope.literals[term.id] ?? term.id;
    }
    case 'var': {
      const base = scope.variables[term.id] ?? term.id;
      return `${base}^{${term.counter}}`;
    }
  }
}

export function extractDerivationTeX(
  system: System,
  derivation: Derivation,
  rootScope: TeXScope,
): string {
  const relation = system.relations[derivation.relation];
  const rule = relation?.rules.find(candidate => candidate.rule.id === derivation.rule);

  const conclusion = commandOf(
    'relation',
    derivation.relation,
    derivation.args.map(term => extractDerivationTermTeX(term, rootScope)),
  );

  const nodeScope = rule ? { variables: rule.variables, literals: rule.literals } : rootScope;

  const premises = derivation.premises
    .map(premise => extractDerivationTeX(system, premise, nodeScope))
    .join(String.raw` \qquad `);

  const ruleTex = rule?.rule.tex ?? derivation.rule;

  return commandOf('system', 'tree', [ruleTex, premises, conclusion]);
}

// oxlint-disable-next-line max-lines-per-function
export function extractTeX(system: System): string {
  const mapEntries: <S, T>(
    obj: Record<string, S>,
    callback: (value: [string, S], index: number) => T,
  ) => Array<T> = (obj, callback) => Object.entries(obj).map((val, ix) => callback(val, ix));

  /// Formatting for \jyGrammar
  const grammarDef = Object.entries(system.syntax).flatMap(([category, definition], ix) =>
    // Format: e ::= & constructor(...args) & description \\
    // On title lines it inserts an extra line with -5pt line spacing
    [
      `${ix === 0 ? '' : String.raw`\\[-5pt] `}& & \\textbf{${definition.description}}`,
      ...definition.grammar.map(
        (grammar, gix) =>
          `${
            gix === 0 ? `${definition.suggestions.join(' , ')} \\mathrel{::=}` : String.raw`\mid`
          } & ${commandOf(
            'grammar',
            `${category}_${grammar.id}`,
            grammar.arguments.map(a => a.tex),
          )} & \\text{${grammar.description}}`,
      ),
    ],
  );

  const definedCommands: Record<
    TeXNamespace,
    Array<readonly [string, { readonly arguments: number; readonly definition: string }]>
  > = {
    // \jg<category><constructor>{...}{...}... macros
    grammar: Object.entries(system.syntax).flatMap(([category, definition]) =>
      definition.grammar.map(
        grammar =>
          [
            `${category}_${grammar.id}`,
            {
              arguments: grammar.arguments.length,
              definition: renderMixfix(
                grammar.fixity,
                grammar.tex_parts,
                Array.from({ length: grammar.arguments.length }, (_, i) => `#${i + 1}`),
              ),
            },
          ] as const,
      ),
    ),
    // \jr<relation>{...}{...}... macros
    relation: mapEntries(system.relations, ([relation, definition]) => [
      relation,
      {
        arguments: definition.arguments.length,
        definition: renderMixfix(
          definition.fixity,
          definition.tex_parts,
          Array.from({ length: definition.arguments.length }, (_, i) => `#${i + 1}`),
        ),
      },
    ]),
    // \jrd<relation> macros
    relationDescription: mapEntries(system.relations, ([relation, definition]) => [
      relation,
      {
        arguments: 0,
        definition: `
        \\boxed{
          \\begin{array}{c}
          ${commandOf(
            'relation',
            relation,
            definition.arguments.map(a => a.tex),
          )} \\\\
          \\text{${definition.description}}
          \\end{array}
        }`,
      },
    ]),
    // \jrr<relation><rule> macros
    relationRule: Object.entries(system.relations).flatMap(([relation, definition]) =>
      definition.rules.map(rule => [
        `${relation}_${rule.rule.id}`,
        {
          arguments: 0,
          definition: commandOf('system', 'infer', [
            rule.rule.tex,
            rule.premises
              .map(p =>
                commandOf(
                  'relation',
                  p.relation,
                  p.args.map(a => renderTerm(a, rule.variables, rule.literals)),
                ),
              )
              .join(String.raw` \\ `),
            commandOf(
              'relation',
              relation,
              definition.arguments.map(a =>
                renderTerm(rule.patterns[a.id]!, rule.variables, rule.literals),
              ),
            ),
          ]),
        },
      ]),
    ),
    // \jrrs<relation> macros
    relationRuleset: mapEntries(system.relations, ([relation, definition]) => [
      relation,
      {
        arguments: 0,
        definition: definition.rules
          .map(r => commandOf('relationRule', `${relation}_${r.rule.id}`))
          .join(String.raw` \allowbreak \qquad `),
      },
    ]),
    system: [
      // \jyDescription
      [
        'description',
        {
          arguments: 0,
          definition: `\\text{${system.description}}`,
        },
      ],
      // \jyInfer{rule name}{premise1 \\ premise2 \\ ...}{conclusion}
      [
        'infer',
        {
          arguments: 3,
          definition: `\\dfrac{\\begin{array}{l} #2 \\end{array}}{ #3 } \\, \\text{[#1]}`,
        },
      ],
      // \jyTree{rule name}{premise1 \\qquad premise2}{conclusion}
      [
        'tree',
        {
          arguments: 3,
          definition: `\\dfrac{\\begin{array}{c} #2 \\end{array}}{ #3 } \\, \\text{[#1]}`,
        },
      ],
      [
        'grammar',
        {
          arguments: 0,
          definition: `\n  \\begin{array}{rll}\n    ${grammarDef.join(' \\\\\n    ')}\n  \\end{array}`,
        },
      ],
    ],
  };

  /// Render defined commands
  let output = '';
  for (const [ns, commands] of Object.entries(definedCommands)) {
    const namespace = ns as keyof typeof definedCommands;
    output += `% Bindings from namespace '${namespace}'\n`;
    output += commands
      .map(
        ([command, macro]) =>
          `${String.raw`\newcommand{` + commandOf(namespace, command)}}[${macro.arguments}]{${
            macro.definition
          }}\n`,
      )
      .join('');
  }
  return output;
}
