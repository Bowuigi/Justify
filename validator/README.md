# Validator

Validator for the various formats included in [Justify](https://github.com/Bowuigi/Justify).

The wiring that makes this all happen does not exist yet, so the verifier is only a wrapper around the parser for now.

Validation passes (NYI is "not yet implemented", RW is "requires wiring"):

- JSON schema checking
- (NYI) Valid TeX checking
- (NYI) Correct operator definition checking (fixity, texParts count and argument count)
- (RW) Check that patterns match on every argument
- (NYI) Scope check for relation variables
- (NYI) Scope check for rule variables and identifiers
- (NYI) Using only defined constructors
- (RW) Using only defined relations
- (NYI) Using only defined syntax categories on constructors
- (NYI) Variables and identifiers in a rule or query must not overlap
- (NYI) Constructor type checking
- (NYI) Relation type checking
- (NYI) Check that relations have at least one parameter (the lang is pure, zero argument relations are useless aside from log filling)
