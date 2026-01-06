// NOTE: Rules are ordered. Earlier ones are tried first
import * as z from 'zod';
import { SIdentifier, SIdentifierTeXMap as SIdentifierTeXMap, STeXMath, STeXText } from './common';

const SFixity = z.enum(["infix", "prefix", "postfix", "none"]);

const STypedArgument = z.strictObject({
  from: SIdentifier,
  id: SIdentifier,
  tex: STeXMath,
});

const STerm = z.union([
  // Both variables and identifiers
  SIdentifier,
  // Constructors
  z.strictObject({
    tag: SIdentifier,
    get args() { return z.array(STerm) }
  }),
]);
export type STerm = z.infer<typeof STerm>;

const SRelationCall = z.strictObject({
  relation: SIdentifier,
  args: z.array(STerm)
});

const SRule = z.strictObject({
  rule: z.strictObject({ tex: STeXText, id: SIdentifier }),
  variables: SIdentifierTeXMap,
  identifiers: SIdentifierTeXMap,
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
  description: STeXText,
  texParts: z.array(STeXMath),
  fixity: SFixity,
  arguments: z.array(STypedArgument)
});

const SSyntax = z.record(SIdentifier, z.strictObject({
  description: STeXText,
  suggestions: z.array(STeXMath),
  grammar: z.array(SGrammar),
}));

export const SSystem = z.strictObject({
  description: STeXText,
  syntax: SSyntax,
  // (Relation name, relation) pairs. Ensures uniqueness
  relations: z.record(SIdentifier, SRelation)
});
export type SSystem = z.infer<typeof SSystem>;
