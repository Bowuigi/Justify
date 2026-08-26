# RFC-QueryResult: The QueryResult format

## Abstract

A QueryResult is the output of running a Query against a System after a solving
process. It reports the found solutions, their variable bindings, and, when
available, the proof tree that accounts for each solution. This document
specifies the QueryResult format. Terms, identifiers, and variable identity are
defined in RFC-common. A QueryResult is meaningful only against the System it
came from, as recorded in RFC-common Section 7.

## 1. Overall structure

A QueryResult document has two top-level keys:

- `solutions`: an array of solution objects, each carrying the bindings for the
  query's variables and an optional derivation tree.
- `count`: a non-negative integer, the number of solutions.

### 1.1 `count`

`count` is the total number of solutions found. A consumer MUST treat `count` as
authoritative for that number.

`count` is kept separate from the `solutions` array deliberately. It lets a
producer report a total that exceeds the number of returned solutions without
breaking a consumer that reads only what is present. Current producers always
return every solution they found, so `count` equals the length of `solutions`,
but the format does not require that. A consumer MUST NOT assume the two are
equal.

## 2. Solutions

Each element of `solutions` has:

- `variables`: a map from query variable identifier to a term giving that
  variable's final binding in this solution. Only the query's own variables
  appear here. Rule-local variables introduced during solving are internal and
  MUST NOT surface as keys in this map, even though they may appear inside the
  derivation.
- `derivation`: optional. When present, it is a derivation tree (Section 3)
  proving the solution. The format keeps it optional so that externally produced
  results need not carry proofs. A producer MAY omit it; a consumer MUST accept
  its absence.

## 3. Derivation trees

A derivation is a tree proving that the concluding judgment holds. A node has
four fields:

- `relation`: the identifier of the relation being concluded.
- `rule`: the identifier of the rule used to conclude it.
- `args`: an array of terms, the concluding judgment's arguments.
- `premises`: an array of derivation nodes, one per premise of the rule, in rule
  order. A leaf has an empty `premises`.

A derivation is isomorphic to the inference rules that fired: each node records
the rule and relation it used, its concluding arguments, and the subderivations
for each premise. Both `relation` and `rule` MUST name definitions that exist in
the target System.

## 4. Result terms

Every term in a QueryResult is drawn from the resolved term model in RFC-common
Section 3.3. A result term is one of:

- `con`: a constructor application, exactly as in any format.
- `lit`: a literal constant, identified by its `id`.
- `var`: a variable, identified by its `id` and `counter`.

A binding that is fully determined appears as a `con`, possibly nested. A
binding left open appears as a `var`. A literal constant appears as a `lit`.
Treat `(id, counter)` as a variable's true identity, per RFC-common Section 6.1.

## 5. Example

A result for the equality query of Section 5 of RFC-Query could carry two
solutions, each with a derivation proving the equality rule that fired.

```json
{
  "solutions": [
    {
      "variables": {
        "p": { "is": "con", "from": "number", "tag": "zero", "args": [] },
        "q": { "is": "con", "from": "number", "tag": "zero", "args": [] }
      },
      "derivation": {
        "rule": "base",
        "relation": "equal",
        "args": [
          { "is": "con", "from": "number", "tag": "zero", "args": [] },
          { "is": "con", "from": "number", "tag": "zero", "args": [] }
        ],
        "premises": []
      }
    }
  ],
  "count": 1
}
```

Fragment only, abbreviated for space. Where a solved variable is not fully
determined, its binding is a `var` term instead of a fully nested `con`, per
Section 4.