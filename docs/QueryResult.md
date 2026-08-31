# The QueryResult format

## Abstract

A QueryResult is the output of running a [Query](./Query.md) against a [System](./System.md) after solution search. It reports the found solutions, their metavariable bindings, and, when available, the proof tree that accounts for each solution. This document specifies the QueryResult format, using JSON as a base.

This file uses the conventions detailed in [common.md](./common.md), so read that first.

## Overall structure

A QueryResult document is a JSON object with the following top-level keys:

- `solutions`: an array of solution objects, each carrying the bindings for the query's variables and an optional derivation tree.
- `count`: a non-negative integer, the number of solutions found. It MUST be equal to the length of the `solutions` array.

## Solutions

Each element of `solutions` has:

- `variables`: a map from query metavariable to a resolved term giving that metavariable's final binding in this solution. Only the query's own variables appear here. Other metavariables introduced during solving are internal and MUST NOT surface as keys in this map, even though they may appear inside the derivation.
- `derivation`: optional. When present, it is a derivation tree proving the solution.

## Derivation trees

A derivation tree is a proof that the relation holds for the given arguments. It has a tree-shaped trace of sub-derivations that were called as preconditions/premises. Each derivation tree has the following fields:

- `relation`: the identifier of the relation. This relation MUST exist in the corresponding System file.
- `rule`: the identifier of the rule chosen. This rule MUST exist in the corresponding relation declaration.
- `args`: an ordered array of resolved terms, the relations' arguments. The length of this array MUST match the length of the `arguments` field of the matching relation declaration. Each argument MUST match its corresponding declared syntax category (in `arguments`), or, if the syntax category is `"literal"`, be a `lit` term.
- `premises`: an array of derivation trees, one per premise of the rule, that were required for the rule to be satisfied.
