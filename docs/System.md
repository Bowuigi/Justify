Note: this file should have how to handle tex_parts + arguments + fixity, with the intersperse algorithm too (somewhere in previous Deepseek chats)

# The System format

## Abstract

A System is a machine- and human-readable description of a logical system or programming language, expressed as inference rules. It declares the syntax categories and constructors of the language, and the relations defined over that syntax by an inductive set of rules. This document specifies the System format.

This file uses the conventions detailed in [common.md](./common.md).

## Overall structure

A System document has the following top-level keys:

- `description`: the name or prose description of the system, as LaTeX text.
- `syntax`: a map from syntax category name to a category definition. Each syntax category name MUST be an identifier.
- `relations`: a map from relation name to a relation definition. Each relation name MUST be an identifier.

## Syntax categories

Each JSON object in `syntax.<category>` describes one syntax category, that is, a group of constructors that you can use in terms and relations. This object has the following keys:

- `description`: LaTeX text denoting the description of the syntax category.
- `suggestions`: an array of LaTeX math strings proposing metavariable names for
  terms of this syntax category. These are purely advisory.
- `grammar`: the array of constructors that syntax category has.

### Constructors

Each constructor inside a syntax category's grammar MUST be a JSON object containing:

- `id`: an identifier, unique within the category. This is the constructor's `tag`.
- `description`: a `tex_text`.
- `tex_parts`: an array of `tex_math`, as in RFC-common Section 4.
- `fixity`: one of `infix`, `prefix`, `postfix`, `none`, as in RFC-common Section 4.
- `arguments`: an array of argument declarations.

An argument declaration has three fields:

- `from`: the identifier of the argument's syntax category, or the reserved
  category `"literal"` (RFC-common Section 6).
- `id`: an identifier used as the display placeholder for this argument, for
  example `n`.
- `tex`: a `tex_math` label for the argument.

### Constructor identity and arity

A constructor's `tag` is a reference to a global definition, not display text.
Display is derived from `tex_parts` and the arguments' `tex` labels. Two
constructors that share a `tag` MUST therefore agree on arity, because `tag` is
the same definitional reference. A `con` term that names this category and tag
MUST supply exactly the declared number of arguments.

## Relations

The value of `relations.<name>` describes one relation, a judgment over
arguments drawn from the syntax categories. It has four keys:

- `description`: a `tex_text`.
- `tex_parts` and `fixity`: as in RFC-common Section 4, rendering the judgment.
- `arguments`: the relation's parameters, each an argument declaration exactly
  as in Section 2.1.
- `rules`: the array of inference rules defining the relation.

A relation SHOULD declare at least one parameter.

### Rules

An inference rule defines one way to conclude the relation. Each rule has four
keys:

- `rule`: an object with two fields. `id` is an identifier, the rule's name.
  `tex` is a `tex_text` label shown above the inference line, for example
  `Base`.
- `variables` and `literals`: maps as in RFC-common Section Their scope is
  this rule.
- `patterns`: a map from relation parameter id to a term. Every parameter of the
  relation MUST appear at least once as a key. Each value is a pattern term to
  unify with that parameter.
- `premises`: an array of premise objects. Each premise has a `relation`, the
  identifier of a relation, and `args`, an array of terms, usually references to
  the rule's variables. A premise states that that valuation of the relation
  must hold for the rule to apply.

## Cross-references and constraints

A valid System keeps every reference resolvable:

- A `con` term's `from` MUST name one of the declared syntax categories, and its
  `tag` MUST name one of that category's constructors (RFC-common Section 3.1).
- A relation referenced in any context MUST be defined in `relations`.
- The `patterns` map MUST cover every declared parameter of the relation.
- A reference (`ref`) inside a rule MUST point to a name declared in that rule's
  `variables` or `literals` (RFC-common Section 6).
- A reference (`ref`) argument of `from: "literal"` MUST point to a declared
  literal or variable.

References to undefined categories, constructors, or relations, and reference
ids not declared in a rule's `variables` or `literals`, are errors and MUST be
rejected.

## Example

A small system over natural numbers defines one category, `number`, with a
constant and a successor, and one relation, `equal`.

```json
{
  "description": "Natural numbers",
  "syntax": {
    "number": {
      "description": "Natural numbers",
      "suggestions": ["n", "m"],
      "grammar": [
        {
          "id": "zero",
          "description": "Zero",
          "tex_parts": ["0"],
          "fixity": "none",
          "arguments": []
        },
        {
          "id": "succ",
          "description": "Successor",
          "tex_parts": ["S"],
          "fixity": "prefix",
          "arguments": [{ "from": "number", "id": "n", "tex": "n" }]
        }
      ]
    }
  },
  "relations": {
    "equal": {
      "description": "Equality",
      "tex_parts": ["="],
      "fixity": "infix",
      "arguments": [
        { "from": "number", "id": "n", "tex": "n" },
        { "from": "number", "id": "m", "tex": "m" }
      ],
      "rules": [
        {
          "rule": { "id": "base", "tex": "Base" },
          "variables": {},
          "literals": {},
          "patterns": {
            "n": { "is": "con", "from": "number", "tag": "zero", "args": [] },
            "m": { "is": "con", "from": "number", "tag": "zero", "args": [] }
          },
          "premises": []
        }
      ]
    }
  }
}
```

Fragment only. A fuller example with an inductive successor rule appears in the
committed System files that accompany this suite.
