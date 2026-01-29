#!/bin/sh
# Generate TS types for every schema
# jtd-codegen always asks for a dir and generates an index.ts file on it

mkdir -p formats/codegen/ts

echo 'Generating types for System...'
jtd-codegen --typescript-out formats/codegen/ts/ formats/system.jtd.json
mv formats/codegen/ts/index.ts formats/codegen/ts/system-types.ts

echo 'Generating types for Query...'
jtd-codegen --typescript-out formats/codegen/ts/ formats/query.jtd.json
mv formats/codegen/ts/index.ts formats/codegen/ts/query-types.ts

echo 'Generating JSON validator for System...'
./node_modules/.bin/ajv compile --spec=jtd -s formats/system.jtd.json -o formats/codegen/ts/system-validator.cjs --code-optimize=5

echo 'Generating JSON validator for Query...'
./node_modules/.bin/ajv compile --spec=jtd -s formats/query.jtd.json -o formats/codegen/ts/query-validator.cjs --code-optimize=5

echo 'Done!'
