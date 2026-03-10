import type * as T from '../../formats/driver.ts';
import * as C from '../module-common.ts';

// Used to create a mapping (moduleId -> formatError)
export const managedError = 'PMA' as const;

interface MissingPatterns extends C.ModuleError<typeof managedError, 'M'> {
  expectedPatterns: Set<string>,
  missingPatterns: Set<string>,
}

interface ExtraPatterns extends C.ModuleError<typeof managedError, 'E'> {
  expectedPatterns: Set<string>,
  extraPatterns: Set<string>,
}

// Used to type stuff later
export type PushedError = MissingPatterns | ExtraPatterns;

// One of the various possible handlers
export function onPatterns(errors: C.ErrorStack<PushedError>, path: C.LocationPath, relationId: string, patterns: T.SystemRelationRule['patterns'], system: T.System) {
  const expectedPatterns = new Set(system.relations[relationId].arguments.map(a => a.id));
  const providedPatterns = new Set(Object.keys(patterns));
  const missingPatterns: Set<string> = expectedPatterns.difference(providedPatterns);
  const extraPatterns: Set<string> = providedPatterns.difference(expectedPatterns);

  if (missingPatterns.size !== 0) {
    errors.push({
      moduleId: 'PMA',
      id: 'PMA-M',
      sourceOfTruthLocation: ['system', 'relations', relationId, 'arguments'],
      location: path,
      expectedPatterns,
      missingPatterns
    });
  }

  if (extraPatterns.size !== 0) {
    errors.push({
      moduleId: 'PMA',
      id: 'PMA-E',
      sourceOfTruthLocation: ['system', 'relations', relationId, 'arguments'],
      location: path,
      expectedPatterns,
      extraPatterns
    });
  }
}

export function formatError(err: PushedError): C.ModuleErrorInfo {
  switch (err.id) {
    case 'PMA-M':
      return {
        message: `Missing ${C.displayIterable('pattern', 'patterns', err.missingPatterns)}`,
        hints: [`Expected ${C.displayIterable('pattern', 'patterns', err.expectedPatterns)}`],
        location: err.location,
        sourceOfTruthLocation: err.sourceOfTruthLocation,
        id: err.id,
      };
    case 'PMA-E':
      return {
        message: `Extra ${C.displayIterable('pattern', 'patterns', err.extraPatterns)}`,
        hints: [`Expected ${C.displayIterable('pattern', 'patterns', err.expectedPatterns)}`],
        location: err.location,
        sourceOfTruthLocation: err.sourceOfTruthLocation,
        id: err.id,
      };
  }
}
