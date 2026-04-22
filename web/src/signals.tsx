import { signal } from '@preact/signals';
import type * as T from '../../../formats/codegen/ts/types.d.ts';

// Syntax categories -> Constructors -> Argument syntax categories
type SystemSyntaxData = Record<T.Identifier, Record<T.Identifier, Array<T.Identifier>>>;

// Changes on import or on syntax data update
// export const systemSyntaxData = signal<SystemSyntaxData>({});
// Data for testing, one would use a form to change this instead
export const systemSyntaxData = signal<SystemSyntaxData>({
  term: {
    variable: ['literal'],
    lambda: ['literal','type','term'],
    apply: ['term','term'],
    star: [],
  },
  type: {
    arrow: ['type','type'],
    unit: [],
  },
  context: {
    empty: [],
    extend: ['context','literal','type'],
  },
});
