import * as z from 'zod';
import { SIdentifier, SIdentifierTeXMap, STerm } from './common';

export const SQuery = z.strictObject({
  variables: SIdentifierTeXMap,
  literals: SIdentifierTeXMap,
  max_results: z.int().positive(),
  relation: SIdentifier,
  args: z.array(STerm),
});
export type SQuery = z.infer<typeof SQuery>;
