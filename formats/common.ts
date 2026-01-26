import * as z from 'zod';
import { readFile } from 'node:fs/promises';
import { exit } from 'node:process';

// Identifiers are in snake-case to simplify exports (conversion is easy)
export const SIdentifier = z.string().regex(/^[a-z0-9_]+$/);
export const STeXText = z.string();
export const STeXMath = z.string();
export const SIdentifierTeXMap = z.record(SIdentifier, STeXMath);

export const STerm = z.union([
  // Both variables and identifiers
  SIdentifier,
  // Constructors
  z.strictObject({
    tag: SIdentifier,
    get args() { return z.array(STerm) }
  }),
]);
export type STerm = z.infer<typeof STerm>;

// From https://zod.dev/codecs#jsonschema
const jsonCodec = <T extends z.core.$ZodType>(schema: T) =>
  z.codec(z.string(), schema, {
    decode: (jsonString: string, ctx: any) => {
      try {
        return JSON.parse(jsonString);
      } catch (err: any) {
        ctx.issues.push({
          code: "invalid_format",
          format: "json",
          input: jsonString,
          message: err.message,
        });
        return z.NEVER;
      }
    },
    encode: (value: any): string => JSON.stringify(value),
  });

function decodeFromJSON<T extends z.core.$ZodType>(codec: T, json: string): z.infer<T> | string {
  const result = jsonCodec(codec).safeDecode(json);

  if (result.success) {
    return result.data;
  } else {
    return z.prettifyError(result.error);
  }
}

export async function parseFile<T extends z.core.$ZodType>(schema: T, schemaName: string, filename: string): Promise<z.infer<typeof schema>> {
  const result = decodeFromJSON(schema, await readFile(filename, { encoding: 'utf-8' }));

  if (typeof result === 'string') {
    console.error(`Error while parsing ${schemaName}:\n${result}`);
    exit(1);
  }

  return result;
}
