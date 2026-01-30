// Common part
import { readFile } from "node:fs/promises";
import betterAjvErrors from "better-ajv-errors";
// For reexports
import type { Query, System } from "./codegen/ts/types.d.ts";
import VSystem from "./codegen/ts/system-validator.cjs";
import VQuery from "./codegen/ts/query-validator.cjs";
import systemSchema from "./system.jtd.json" with { type: 'json' };
import querySchema from "./query.jtd.json" with { type: 'json' };

// Common function across various schemas
async function parseFile<T>(
  schema: any,
  validator: any,
  filename: string,
): Promise<T | null> {
  const contents = await readFile(filename, { encoding: "utf8" });
  let json: any = null;

  try {
    json = JSON.parse(contents);
  } catch (err: any) {
    console.error(`${filename}: JSON parsing error: ${err.message}`);
    return null;
  }

  const valid = validator(json);
  if (!valid) {
    console.error(
      betterAjvErrors(schema, json, validator.errors, { json: contents }),
    );
    return null;
  } else {
    return json as T;
  }
}

export type * from "./codegen/ts/types.d.ts";
export const parseSystem = (filename: string) =>
  parseFile<System>(systemSchema, VSystem, filename);
export const parseQuery = (filename: string) =>
  parseFile<Query>(querySchema, VQuery, filename);
