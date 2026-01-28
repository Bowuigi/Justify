#!/bin/sh
# Generate TS types for every schema
# jtd-codegen always asks for a dir and generates an index.ts file on it

mkdir -p formats/codegen/ts

echo 'Generating types for System...'
jtd-codegen --typescript-out formats/codegen/ts/ formats/system.jtd.json
mv formats/codegen/ts/index.ts formats/codegen/ts/system.ts

echo 'Generating types for Query...'
jtd-codegen --typescript-out formats/codegen/ts/ formats/query.jtd.json
mv formats/codegen/ts/index.ts formats/codegen/ts/query.ts

echo 'Done!'
