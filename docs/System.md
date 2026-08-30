# The System format

## Abstract

A System is a machine- and human-readable description of a logical system or programming language, expressed as inference rules. It declares the syntax categories and constructors of the language, and the relations defined over that syntax by an inductive set of rules. This document specifies the System format.

This file uses the conventions detailed in [common.md](./common.md), so read that first.

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

- `id`: an identifier, unique within the category. This is the constructor's `tag`. It cannot be named `"identifier"` as it is reserved for literal identifiers.
- `description`: LaTeX text describing what the constructor _means_.
- `tex_parts`: an array of LaTeX math representing each mixfix operator part used for formatting when LaTeX rendering is available.
- `fixity`: one of `infix`, `prefix`, `postfix`, `none`. Used for formatting when LaTeX rendering is available.
- `arguments`: an array of argument declarations. Used both for formatting and for creating terms of that constructor.

### Constructor usage and rendering

A constructor's `tag` is a reference to a global definition, which MUST point at a defined syntax category. Two constructors that share `from` and `tag` fields MUST have equal number of arguments, matching the syntax category's declared amount.

In order to format a constructor when LaTeX rendering is available, the `tex_parts`, `arguments` and `fixity` constitute a mixfix operator:

- If `fixity` is `none`, one of those MUST apply:
  - Zero arguments and one TeX part, displaying the TeX part alone (e.g. zero-ary constructors).
  - One argument and zero TeX parts, displaying only the argument given (e.g. singular variable-like constructor).
  - $n$ arguments and $n+1$ TeX parts (for any natural number $n$ except $0$), interspersing both on display, starting and ending with a part (e.g. closed mixfix operators like math floor).
- If `fixity` is `infix`, there MUST be $n+1$ arguments and $n$ parts (for any natural number $n$ except $0$), interspersing both on display, starting and ending with an argument (e.g. addition).
- If `fixity` is `prefix`, there MUST be $n$ parts and $n$ arguments (for any natural number $n$ except $0$), interspersing both on display, starting with an argument and ending with a part.
- If `fixity` is `postfix`, there MUST be $n$ parts and $n$ arguments, interspersing both on display, starting with a part and ending with an argument.

One of those cases MUST happen, otherwise, an error MUST be signaled.

If LaTeX rendering is unavailable, a user SHOULD only display the constructor's fields in any way convenient, omitting LaTeX annotations.

## Relations

Each value of `relations.<name>` describes a logical relation over arguments drawn from the syntax categories. It has those keys:

- `description`: LaTeX text describing the description.
- `tex_parts`: an array of LaTeX math representing each mixfix operator part used for formatting when LaTeX rendering is available.
- `fixity`: one of `infix`, `prefix`, `postfix`, `none`. Used for formatting when LaTeX rendering is available.
- `arguments`: an array of argument declarations. Used both for formatting and for creating terms of that constructor.
- `rules`: the array of inference rules defining the relation's behavior.

A relation MUST declare at least one argument.

`fixity`, `tex_parts` and `arguments` are rendered in the same way constructors are, see [here](#constructor-usage-and-rendering).

### Rules

An inference rule defines how a logical relation behaves on a specific case, each distinguished **only** by the identifier naming the rule. It contains those fields:

- `rule`: an object with two fields:
  - `id`: an identifier, the rule's name.
  - `tex`: a LaTeX text label displayed as the rule name when LaTeX rendering is available.
- `variables` and `literals`: Identifier maps specifying the local scope of any unresolved terms inside.
- `patterns`: a map from relation parameter identifier to an unresolved term. Every parameter of the relation MUST appear exactly once as a key. Each value is meant to be unified with its corresponding argument, though other equivalent methods MAY be used.
- `premises`: an array of premises. Each premise has:
  - `relation`: The identifier of a relation. This relation MUST exist in the relation map.
  - `args`: an ordered array of unresolved terms. The length of this array MUST match the length of the `arguments` field of the matching relation declaration. Each argument MUST match its corresponding declared syntax category (in `arguments`), or, if the syntax category is `"literal"`, be a `ref` term pointing to a literal in scope.

Each premise MUST hold for the rule to apply, but their order of evaluation is left to implementations (even allowing parallelism).
