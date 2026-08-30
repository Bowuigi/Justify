# The Query format

## Abstract

A Query is a single question asked against a [System file](./System.md). It specifies the relation to query, provides its arguments, possibly including variables and literal identifiers, and provides execution limits for a dedicated engine to interpret. This document specifies the Query file format, using JSON as a base.

This file uses the conventions detailed in [common.md](./common.md), so read that first.

## Overall structure

A Query document has the following top-level keys:

- `relation`: an identifier, the relation to query. It MUST name a relation defined in the target System.
- `max_results`: a non-negative integer, the maximum number of solutions to report, even if more are available. Solution search MUST stop if this many solutions are found.
- `variables`: A `variables` identifier map denoting the metavariables bound in the current scope.
- `literals`: A `literals` identifier map denoting the literal identifiers bound in the current scope.
- `args`: an ordered array of unresolved terms. The length of this array MUST match the length of the `arguments` field of the matching relation declaration. Each argument MUST match its corresponding declared syntax category (in `arguments`), or, if the syntax category is `"literal"`, be a `ref` term pointing to a literal in scope.
