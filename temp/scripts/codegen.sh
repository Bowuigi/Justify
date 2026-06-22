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

cd ../../../
echo '--- Generating fused file for validator modules ---'

cd validator/codegen || exit 1
rm -f fused.ts
awk '
/export const managedError/ {
  fnameMap[FILENAME] = gensub(/'\''/, "", "g", $5)
}

/export function on/ {
  fun = gensub(/\(.*/, "", "1", $3)
  on[fun][fnameMap[FILENAME]] = 1
  signatureMap[fun] = $0
}

END {
  print "import type * as T from \"../../formats/driver.ts\""
  print "import type * as C from \"../module-common.ts\""

  for (fname in fnameMap) {
    printf "import * as %s from \"%s\"\n", fnameMap[fname], fname
  }

  printf "\nexport type PushedError ="
  for (fname in fnameMap) {
    printf " | %s.PushedError", fnameMap[fname]
  }
  print ";"

  for (fun in on) {
    print ""
    print signatureMap[fun]
    for (fname in on[fun]) {
      printf "  // @ts-ignore: 2741 - `arguments` here is known to be the correct type\n"
      printf "  %s.%s(...arguments);\n", fname, fun
    }
    print "}"
  }

  print "\nexport function formatError(err: PushedError): C.ModuleErrorInfo {"
  print "  switch (err.moduleId) {"
  for (fname in fnameMap) {
    printf "    case \"%s\": return %s.formatError(err);\n", fnameMap[fname], fnameMap[fname]
  }
  print "  }"
  print "}"
}
' ../modules/*.ts > fused.ts
