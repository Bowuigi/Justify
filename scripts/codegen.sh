#!/bin/sh
# Generate TS types for every schema
# jtd-codegen always asks for a dir and generates an index.ts file on it

mkdir -p formats/codegen/ts
cd formats || exit 1

for schema_file in *.jtd.json; do
  schema="$(basename "$schema_file" .jtd.json)"

  echo "--- Generating types for ${schema} ---"
  jtd-codegen --typescript-out codegen/ts/ "$schema_file"
  mv codegen/ts/index.ts "codegen/ts/${schema}-types.d.ts"

  echo "--- Generating JSON validator for ${schema} ---"
  ../node_modules/.bin/ajv compile --spec=jtd -s "$schema_file" -o "codegen/ts/${schema}-validator.cjs" --code-optimize=5
done

echo '--- Generating barrel file for types ---'

cd codegen/ts || exit 1
rm -f types.d.ts
awk '
/^export (type|enum|interface)/ {
  typedefs[$3] = FILENAME
}

END {
  for (def in typedefs)
    printf "export type { %s } from \"%s\";\n", def, typedefs[def]
}
' ./*.d.ts > types.d.ts
