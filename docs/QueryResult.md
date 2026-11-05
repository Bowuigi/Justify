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
- `constraints`: An array of constraints that the variables must follow on instantiation for the solution to be valid. If it is empty, no extra constraints are to be assumed.
- `derivation`: optional. When present, it is a derivation tree proving the solution.

## Derivation trees

A derivation tree is a proof that the relation holds for the given arguments. It has a tree-shaped trace of sub-derivations that were called as preconditions/premises. Each derivation tree has the following fields:

- `relation`: the identifier of the relation. This relation MUST exist in the corresponding System file.
- `rule`: the identifier of the rule chosen. This rule MUST exist in the corresponding relation declaration.
- `args`: an ordered array of resolved terms, the relations' arguments. The length of this array MUST match the length of the `arguments` field of the matching relation declaration. If the corresponding syntax category is `"literal"`, the argument MUST either be a `var` or a `lit` term; if it isn't, the argument MUST either be a `con` term or a `var` term.
- `premises`: an array of derivation trees, one per premise of the rule, that were required for the rule to be satisfied.

## Constraints

A constraint is a restriction on a solution's bindings required for it to hold. Each constraint is a JSON object with an `is` discriminator field. The following constraints are supported:

### `neq` constraint

Asserts that two terms must never be equal for the solution to hold. It has the following fields:

- `a`: a resolved term, part of the comparison.
- `b`: a resolved term, part of the comparison.
