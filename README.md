# Justify

A (work in progress) web-based type system simulator.

## Why?

Understanding how type systems work with just your imagination is complex and error-prone. You either have to guess the types of a program yourself or build another program that does that for you (a typechecker), both of which take a lot of time.

Its format (see `src/format.ts` or the examples) is meant to be open in order to ease integration with external tools such as theorem provers, code generators, structural editors, etc.

## How?

The project consists (or rather, will consist) of three parts:

- An open format (see `src/format.ts`)
- A [miniKanren](https://minikanren.org/) implementation featuring a different interface (to aid in logic program generation), a "relation call stack" to generate derivation trees and an implementation of [simple complete search](https://dl.acm.org/doi/10.1145/3093334.2989230). This implementation takes the system and a query as inputs and returns a list of possible derivation trees (if any) that satisfy the query.
- A web UI that wraps those and acts as a nice interface to edit the format and do queries.
