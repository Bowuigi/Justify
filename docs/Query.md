# The Query format

## Abstract

A Query is a single question asked against a [System file](./System.md). It specifies the relation to query, provides its arguments, possibly including variables and literal identifiers, and provides execution limits for a dedicated engine to interpret. This document specifies the Query file format, using JSON as a base.

This file uses the conventions detailed in [common.md](./common.md).

## Overall structure

A Query document has the following top-level keys:

- `relation`: an identifier, the relation to query. It MUST name a relation defined in the target System.
- `max_results`: a non-negative integer, the maximum number of solutions to report.
- `variables`: A `variables` identifier map denoting the metavariables bound in the current scope.
- `literals`: A `variables` identifier map denoting the metavariables bound in the current scope.
- `args`: an ordered array of unresolved terms, acting as the arguments for that relation. Its length MUST match the relation's declared arity. Uses the current scope for term resolution.

TODO
## Arguments

The `args` count MUST equal the relation's declared number of parameters. The
`args` MUST also be compatible with the parameters' declared categories and with
the System's grammar.

## Variables and literals

The `variables` and `literals` maps declare the scope of every `ref` in `args`
(RFC-common Section 6).

- A name in `variables` is an unknown. Its binding appears among the results.
- A name in `literals` is a constant, used to pin an argument to a fixed value.
- A `ref` in `args` MUST point to a name declared in one of the two maps. An
  unbound reference is an error.
- A name SHOULD NOT appear in both maps of the same Query.

An argument to a parameter of category `"literal"` MUST be a `ref` to a declared
literal or variable, matching RFC-common Section 6.

## `max_results`

`max_results` MUST be a non-negative integer and MAY be any value that fits the
format. It caps the number of solutions reported: an engine MUST stop searching
after this many solutions are found. It exists so a query that would produce an
infinite or very large set of answers returns a bounded, useful result instead.

## Example

The following Query asks a System for the product of two concrete natural
numbers, `succ(succ(zero))` and `succ(succ(succ(zero)))`, leaving the answer
open as the variable `r`. It asks for at most one solution.

```json
{
  "variables": { "r": "r" },
  "literals": {},
  "max_results": 1,
  "relation": "multiply",
  "args": [
    {
      "is": "con",
      "from": "number",
      "tag": "succ",
      "args": [
        {
          "is": "con",
          "from": "number",
          "tag": "succ",
          "args": [
            { "is": "con", "from": "number", "tag": "zero", "args": [] }
          ]
        }
      ]
    },
    {
      "is": "con",
      "from": "number",
      "tag": "succ",
      "args": [
        {
          "is": "con",
          "from": "number",
          "tag": "succ",
          "args": [
            {
              "is": "con",
              "from": "number",
              "tag": "succ",
              "args": [
                { "is": "con", "from": "number", "tag": "zero", "args": [] }
              ]
            }
          ]
        }
      ]
    },
    { "is": "ref", "to": "r" }
  ]
}
```

Fragment only, abbreviated for space. The full nested form is what the format
requires.
