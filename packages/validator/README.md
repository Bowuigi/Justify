# Validator

Validator for the various formats included in [Justify](https://github.com/Bowuigi/Justify).

Validation passes (NYI is "not yet implemented"):

- JSON schema checking
- Check that patterns match on every argument
- Using only defined syntax categories on constructors
- Using only defined constructors
- Using only defined relations
- Passing the correct number of arguments
- (NYI) Valid TeX checking
- (NYI) Correct operator definition checking (fixity, texParts count and argument count)
- (NYI) Scope check for relation variables
- (NYI) Scope check for rule variables and literals
- (NYI) Variables and literals in a rule or query must not overlap
- (NYI) Constructor type checking
- (NYI) Relation type checking
- (NYI) Check that relations have at least one parameter (the lang is pure, zero argument relations are useless aside from log filling)

# Usage

From the root of the Justify monorepo, run the following (other TS/JS runtimes are supported):

```sh
# For System files
deno run --allow-read --allow-env packages/validator/main.ts system <your-system.json>

# For Query files
deno run --allow-read --allow-env packages/validator/main.ts query <your-system.json> <your-query.json>

# For DerivationTree files
deno run --allow-read --allow-env packages/validator/main.ts derivation-tree <your-system.json> <your-derivation-tree.json>
```
