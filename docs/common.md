# Shared definitions across the Justify formats

## Abstract

Justify uses various data formats to describe logical systems, the queries you run against them, and the results those queries produce. This document collects the definitions the three formats share: how names are written, how terms are represented, how TeX stays attached to structure, and how variables differ from literals, etc. It also records how the three formats fit together and how they version. Read [System](./System.md), [Query](./Query.md) and [QueryResult](./QueryResult.md) for format-specific information.

System, Query and QueryResult files are related with each other in an out-of-band manner, without any pointers to the other related files inside the documents themselves.

These documents are specifications. They describe what the formats require, independent of any particular program that reads or writes them. The authoritative machine-readable schemas that back these documents are the JSON Type Definition files under [`formats/`](../formats/). Where this document disagrees with those files, the files win.

There's examples of those formats on the [`examples/`](../examples/) directory.

## Notation

The keywords "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "NOT RECOMMENDED", "MAY", and "OPTIONAL" in these documents are to be interpreted as described in BCP 14 (RFC 2119 and RFC 8174) when they appear in all capitals, as shown here.

## Identifiers

An identifier MUST match the regular expression `^[a-z][a-z0-9_]*$`. Every name in the formats is an identifier: syntax categories, constructor tags, relation names, rule identifiers, argument ids, and declared variable and literal names, etc.

Identifiers SHOULD always be written in `snake_case`. Note that the regex allows digits and underscores after the first character, so `x_2` and `f0` are valid identifiers while `X` and `-x` are not.

## Terms

Every format includes some form of terms. A term is a recursive algebraic data type representing code from the modelled logical system, written in JSON via a discriminated union, with `is` as the discriminator property. The discriminator MUST be present in every term.

### Unresolved terms

Present in System and Query files.

They contain the following constructors:

#### Constructor applications

A `con` term is a constructor application. It has three fields (aside):

- `from`: the identifier of a syntax category, which MUST exist in the syntax section of the System file. This identifier MUST NOT be `"literal"`.
- `tag`: the identifier of a constructor within that category, which MUST exist in the grammar subsection of the chosen syntax category.
- `args`: an ordered array of unresolved terms. The length of this array MUST match the length of the `arguments` field of the matching grammar element and syntax category. Each argument MUST match its corresponding declared syntax category (in `arguments`), or, if the syntax category is `"literal"`, be a `ref` term pointing to a literal or variable in scope.

#### References

A `ref` term is a reference to a name in the surrounding scope. It has one field:

- `to`: the identifier of the referenced name, which MUST be in scope.

Whether that name resolves to a variable or a literal is decided by which map declares it.

### Resolved terms

Present in QueryResult files.

They contain the following constructors:

#### Constructor applications

A `con` term is a constructor application. It has three fields:

- `from`: the identifier of a syntax category, which MUST exist in the `syntax` section of the designated System file. This identifier MUST NOT be `"literal"`, as it is reserved for enforcing literal identifier usage in arguments.
- `tag`: the identifier of a constructor within that category, which MUST exist in the grammar subsection of the chosen syntax category.
- `args`: an ordered array of resolved terms. The length of this array MUST match the length of the `arguments` field of the matching grammar element and syntax category. If the corresponding syntax category is `"literal"`, the argument MUST either be a `var` or a `lit` term; if it isn't, the argument MUST either be a `con` term or a `var` term.

#### Literal identifiers

A `lit` term is a literal identifier. It has one field:

- `id`: the identifier in the modelled language.

#### Variable

A `var` term is a metavariable. It has two fields:

- `id`: An identifier, mostly for pretty-printing.
- `counter`: A non-negative number uniquely identifying the metavariable in the file. Two variables with the same counter MUST be assumed to refer to the same term, unless they come from different solutions.

## LaTeX support

System files allow two kinds of LaTeX annotations:

- LaTeX math (`tex_math` in the JTD file), expected to render in math mode, used where a term or formula appears.
- LaTeX text (`tex_text` in the JTD file), expected to render as text, used for human descriptions and rule labels.

Implementations MAY validate compatibility against a specific feature set (KaTeX, MathJaX, etc) and flag incompatibilities, but they MUST be warnings at most, possibly affecting rendering.

## Identifier maps

Identifier maps are JSON objects mapping identifiers to LaTeX math. They're used to make structural sharing explicit in unresolved terms. Those determine the scope available for `ref`s on the same level or below. If LaTeX rendering is available, the math annotation MUST be used to render references, otherwise, the identifier MUST be used for such purpose.

There's two kinds of identifier maps:

- A `variables` identifier map binds fresh metavariables. The latter stand for `var` resolved terms after scope resolution.
- A `literals` identifier map binds literal identifiers. The latter stand for `lit` resolved terms after scope resolution.

When those maps are presented together, they MUST NOT overlap.

## Argument declaration

Argument declarations are a simple form of type checking used in grammar and relation modelling. The System file specifies the expected syntax categories, arity, etc. and every format MUST comply, including the System file itself.

Argument declarations MUST be an array of JSON objects with the following fields:

- `from`: an identifier, either exactly `"literal"` or the identifier associated with a specific syntax category. This syntax category MUST be defined in the System file.
- `id`: an identifier associated with that specific argument. Its use is format-and-location specific. It identifies the argument in a position-independent way.
- `tex`: LaTeX math that defines how to render a placeholder for that argument when LaTeX rendering is available.

An argument whose `from` field is `"literal"` expects a literal identifier in that position.

An argument whose `from` field is a defined syntax category expects a term of that syntax category in that position.

Unless otherwise specified, the zero arguments case is valid.

## Relationships between the formats

The Query and the QueryResult formats require a System file to be used, using the latter to resolve syntax categories and relations.
