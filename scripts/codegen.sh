#!/bin/sh

set -euo pipefail

### @justify/core ###

mkdir -p packages/core/codegen

for schema_file in formats/*.jtd.json; do
  schema="$(basename "$schema_file" .jtd.json)"

  echo "--- Generating types for ${schema} ---"
  # jtd-codegen always asks for a dir and generates an index.ts file on it
  jtd-codegen --typescript-out packages/core/codegen/ "$schema_file"

  mv packages/core/codegen/index.ts "packages/core/codegen/${schema}-types.d.ts"

  tempfile="$(mktemp justify-codegen.XXXXX)"
  awk -f scripts/correct-fixity-from-jtd-codegen.awk "packages/core/codegen/${schema}-types.d.ts" > "$tempfile"
  mv "$tempfile" "packages/core/codegen/${schema}-types.d.ts"

  echo "--- Generating JSON validator for ${schema} ---"
  deno x jsr:@bowuigi/jtd-validator-generator "$schema_file" > "packages/core/codegen/${schema}-validator.ts"
done

echo '--- Generating barrel file for types ---'

cd packages/core/codegen || exit 1
rm -f types.d.ts
awk -f ../../../scripts/generate-barrel-file.awk ./*.d.ts > types.d.ts
cd ../../.. || exit 1

### @justify/validator ###

echo '--- Generating fused file for validator modules ---'

cd packages/validator/codegen || exit 1
rm -f fused.ts
awk -f ../../../scripts/generate-fused-traversal-for-validator.awk ../modules/*.ts > fused.ts
cd ../../.. || exit 1

oxfmt packages/core/codegen/ packages/validator/codegen/
