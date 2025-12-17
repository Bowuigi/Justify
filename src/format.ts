// TODO: Stronger validation by keeping label sets around to check scoping. See https://zod.dev/codecs
// NOTE: Rules are ordered. Earlier ones are tried first
import * as z from 'zod';

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

// Identifiers are in snake-case to simplify exports (conversion is easy)
const SIdentifier = z.string().regex(/^[a-z0-9_]$/);
const STeXText = z.string();
const STeXMath = z.string();
const SFixity = z.enum(["infix", "prefix", "postfix", "none"]);

const STypedArgument = z.strictObject({
  from: SIdentifier,
  id: SIdentifier,
  tex: STeXMath,
});

const SVariable = z.strictObject({
  tex: STeXMath,
  id: SIdentifier,
});

const STerm = z.union([
  SIdentifier,
  z.strictObject({
    tag: SIdentifier,
    get args() { return z.array(STerm) }
  })
]);

const SRelationCall = z.strictObject({
  relation: SIdentifier,
  args: z.array(STerm)
});

const SRule = z.strictObject({
  rule: z.strictObject({ tex: STeXText, id: SIdentifier }),
  variables: z.array(SVariable),
  patterns: z.record(SIdentifier, STerm),
  premises: z.array(SRelationCall),
});

// The relation name is on the system itself
const SRelation = z.strictObject({
  description: STeXText,
  texParts: z.array(STeXMath),
  fixity: SFixity,
  arguments: z.array(STypedArgument),
  rules: z.array(SRule),
});

const SGrammar = z.strictObject({
  id: SIdentifier,
  texParts: z.array(STeXMath),
  fixity: SFixity,
  arguments: z.array(STypedArgument)
});

const SSyntax = z.record(SIdentifier, z.strictObject({
  description: STeXText,
  grammar: z.array(SGrammar),
}));

// (Relation name, Relation) pairs. Ensures uniqueness
const SSystem = z.strictObject({
  description: STeXText,
  syntax: SSyntax,
  relations: z.record(SIdentifier, SRelation)
});

export type SSystem = z.infer<typeof SSystem>;

export function systemFromJSON(json: string): SSystem|null {
  const result = jsonCodec(SSystem).safeDecode(json);

  if (result.success) {
    return result.data;
  } else {
    console.log(result.error);
    return null;
  }
}
