# Inferencer

A type system query engine for [Justify](https://github.com/Bowuigi/Justify) based on [miniKanren](https://minikanren.org) with the following extensions:

- Simple-complete search
- N-ary conj, disj and fresh by default
- fresh supports identifiers for variables
- Occurs check
- Literal values
- Checked variables and literals
- STerm conversions
- Codegen for SSystem / inference rules (check src/mkCodegen.ts)
- Derivation tree generation
- Idempotent substitution transformation
