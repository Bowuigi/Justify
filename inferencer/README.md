# Inferencer

A type system query engine for [Justify](https://github.com/Bowuigi/Justify) based on [miniKanren](https://minikanren.org) with the following extensions:

- Simple-complete search
- N-ary conj, disj and fresh by default
- fresh supports identifiers for variables
- Occurs check
- Literal values
- Checked variables and literals
- Conversion from System/Query terms
- Codegen for System / inference rules (check `mkCodegen.ts`)
- Derivation tree generation
- Idempotent substitution transformation

## Usage

Assuming `deno run --allow-read --allow-env` is used to run Typescript (other runtimes like `bun` and `node` are supported)

```shell
deno run --allow-read --allow-env inferencer/main.ts <system file> <query file>
```
