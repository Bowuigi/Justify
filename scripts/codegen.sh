#!/usr/bin/env bash

set -euo pipefail
script_dir="$(dirname "$(realpath "$0")")"

### @justify/core and @justify/markdown-dsl ###

declare -A input_output
input_output["formats"]="packages/core/codegen"
input_output["packages/markdown-dsl/formats"]="packages/markdown-dsl/codegen"

for input in "${!input_output[@]}"; do
  output="${input_output[${input}]}"

  echo "---- Processing ${input} ----"

  mkdir -p "${output}"

  for schema_file in "${input}"/*.jtd.json; do
    schema="$(basename "${schema_file}" .jtd.json)"

    echo "--- Generating types for ${schema} ---"
    # jtd-codegen always asks for a dir and generates an index.ts file on it
    jtd-codegen --typescript-out "${output}" "${schema_file}"
    mv "${output}/index.ts" "${output}/${schema}-types.d.ts"

    tempfile="$(mktemp justify-codegen.XXXXX)"
    awk -f "${script_dir}/correct-fixity-from-jtd-codegen.awk" "${output}/${schema}-types.d.ts" > "${tempfile}"
    mv "${tempfile}" "${output}/${schema}-types.d.ts"

    echo "--- Generating JSON validator for ${schema} ---"
    deno x jsr:@bowuigi/jtd-validator-generator "${schema_file}" > "${output}/${schema}-validator.ts"
  done

  echo '--- Generating barrel file for types ---'

  cd "${output}" || exit 1
  rm -f types.d.ts
  awk -f "${script_dir}/generate-barrel-file.awk" ./*.d.ts > types.d.ts
  cd ../../.. || exit 1
done

### @justify/validator ###

echo '--- Generating fused file for validator modules ---'

cd packages/validator/codegen || exit 1
rm -f fused.ts
awk -f "${script_dir}/generate-fused-traversal-for-validator.awk" ../modules/*.ts > fused.ts
cd ../../.. || exit 1

## @justify/markdown-dsl

# `jq` is only used to emit valid JSON
# Uses a funny trick to type recursive terms properly
# The Term and RelationCall exports are duplicated by peggy but tsc doesn't complain so it's fine
npx peggy --format es --dts --return-types "$(jq -n -c '{
  Rule: "{
    rule: {id: string, tex: string},
    variables: Record<string, string>,
    literals: Record<string, string>,
    premises: Array<RelationCall>,
    conclusion: RelationCall
  };
  export type RelationCall = {rel: string, args: Array<Term>};
  export type Term = {is: \"ref\", to: string} | {is: \"con\", tag: string, args: Array<Term>}"
    | gsub("[ \n\t]"; " ")
}')" -o packages/markdown-dsl/codegen/rule-parser.js packages/markdown-dsl/formats/rule.peggyjs

oxfmt packages/*/codegen/
