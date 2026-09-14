# Inferencer

A logical system query engine for [Justify](https://github.com/Bowuigi/Justify) based on [miniKanren](https://minikanren.org) with the following extensions:

- Simple-complete search
- N-ary conj, disj and fresh by default
- `fresh` supports identifiers for variables
- Occurs check
- Literal values
- Checked variables and literals
- Conversion from **System**/**Query** terms
- Codegen for **System** / inference rules (check `mk-codegen.ts`)
- Derivation tree generation (for **QueryResult** files)
- Idempotent substitution transformation

## Usage

Assuming `node` is used to run Typescript (other runtimes like `bun` and `deno` are supported) and that your current directory is the root of the Justify monorepo:

```shell
node packages/inferencer/main.ts [-m] <System file> <Query file>
```

The `-m` flag switches on machine-readable output, generating a **QueryResult** file from the **System** and **Query** ones, which is less human-readable but easier to work with programatically.
