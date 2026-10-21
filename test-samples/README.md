# Test samples for various levels of correctness

- `*-invalid-not-json`: Not JSON, but almost.
- `invalid-jtd-*`: Proper JSON, but not following the JTD schemas.
- `*-bare-minimal`: Just enough to pass JTD validation.
- `*-invalid-*`: Triggers a specific `@justify/validator` error (or a set of them, indicating the validator modules that should catch them).
- `*-nyi-<pass>`: Triggers a _known not yet implemented_ `@justify/validator` error (sometimes more than one).
